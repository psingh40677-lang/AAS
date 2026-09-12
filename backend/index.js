// ─────────────────────────────────────────────────────────────
// AAS · Advanced Alied Service — demo API server (Express)
// Prototype only: in-memory demo data, mock OTP, simulated
// Ayushman status. No real government/PM-JAY integration.
// ─────────────────────────────────────────────────────────────
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());

// ── Demo data (matches the frontend seed in src/data.js) ─────
const db = {
  patient: { name: 'Pooja Singh', firstName: 'Pooja', age: 58, mobile: '+91 98765 43210' },
  tokens: [], // { id, department, number, date, time, queue, hospital }
  tokensIssuedToday: 26,
  records: [
    { id: 1, date: '05 Sep 2026', icon: 'stethoscope', title: 'General Medicine', type: 'Consultation', detail: 'Routine consultation. Vitals normal. Continue current medicines. Next review 15 September.' },
    { id: 2, date: '28 Aug 2026', icon: 'test', title: 'CBC Report', type: 'Laboratory Report', detail: 'Complete blood count collected at the hospital lab (demo summary).' },
    { id: 3, date: '28 Aug 2026', icon: 'pill', title: 'Prescription', type: '3 Medicines', detail: 'Prescribed by General Medicine — morning, afternoon and night doses.' },
    { id: 4, date: '10 Aug 2026', icon: 'calendar', title: 'Follow-up Visit', type: 'Consultation', detail: 'Follow-up completed. Next review planned for 15 September at General Medicine.' }
  ],
  medicines: [
    { id: 1, name: 'Medicine A', time: 'Morning', status: 'taken', instruction: 'After breakfast', icon: 'sun' },
    { id: 2, name: 'Medicine B', time: 'Afternoon', status: 'pending', instruction: 'Due at 2:00 PM', icon: 'afternoon' },
    { id: 3, name: 'Medicine C', time: 'Night', status: 'pending', instruction: 'Due at 8:00 PM', icon: 'night' }
  ],
  notifications: [
    { id: 1, kind: 'Ayushman verification', icon: 'idcard', title: 'Your Ayushman card is Active', body: 'Demo beneficiary status.', unread: true },
    { id: 2, kind: 'Medicine reminder', icon: 'pill', title: 'Evening medicine is due', body: 'Medicine C is due at 8:00 PM.', unread: true },
    { id: 3, kind: 'Follow-up reminder', icon: 'stethoscope', title: 'Follow-up due in 5 days', body: 'Your next follow-up is at General Medicine.', unread: false }
  ],
  audit: [
    { id: 1, time: '10:25 AM', text: 'Prescription viewed' },
    { id: 2, time: '09:55 AM', text: 'Health record viewed' }
  ],
  ayushman: { status: 'active', holder: 'Pooja Singh', number: 'XXXX XXXX XXXX', scheme: 'Ayushman Bharat · PM-JAY (demo)', verified: false }
};

const ok = (res, data) => res.json({ success: true, data });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

const logAudit = (text) => {
  db.audit.unshift({ id: db.audit.length + 1 + Math.random(), time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), text });
};

const pushNotification = (n) => {
  db.notifications.unshift({ id: db.notifications.length + 1 + Math.random(), unread: true, ...n });
};

// ── Auth (mock OTP demo) ─────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const mobile = String((req.body && req.body.mobile) || '').replace(/\D/g, '');
  if (mobile.length !== 10) return fail(res, 400, 'Please enter a valid 10-digit mobile number.');
  ok(res, { message: 'Demo OTP sent', demoOtp: '1234' });
});

app.post('/api/auth/verify', (req, res) => {
  const otp = String((req.body && req.body.otp) || '').trim();
  if (otp !== '1234') return fail(res, 401, 'Incorrect OTP. For this demo, use 1234.');
  ok(res, { token: 'demo-session-token', patient: db.patient });
});

// ── Dashboard (single aggregated endpoint) ───────────────────
app.get('/api/dashboard', (_req, res) => {
  ok(res, {
    patient: db.patient,
    upcomingToken: db.tokens.length ? db.tokens[db.tokens.length - 1] : { department: 'General Medicine', number: 27, date: '10 September 2026', time: '10:30 AM', queue: 8, hospital: 'District Hospital' },
    nextMedicine: db.medicines.find((m) => m.status === 'pending') || null,
    followUp: { department: 'General Medicine', date: '15 September', inDays: 5 },
    ayushman: db.ayushman,
    notifications: db.notifications.slice(0, 3)
  });
});

// ── Tokens ───────────────────────────────────────────────────
app.get('/api/departments', (_req, res) => {
  ok(res, [
    { name: 'General Medicine', note: 'Everyday consultations' },
    { name: 'Cardiology', note: 'Heart and blood pressure' },
    { name: 'Orthopedics', note: 'Bones and joints' },
    { name: 'Ophthalmology', note: 'Eye care' }
  ]);
});

app.get('/api/tokens/slots', (_req, res) => {
  ok(res, {
    dates: ['10 September', '11 September', '12 September'],
    times: ['09:00 AM', '10:30 AM', '11:30 AM'],
    note: 'Demo schedule'
  });
});

app.post('/api/tokens', (req, res) => {
  const { department = 'General Medicine', date = '10 September 2026', time = '10:30 AM', hospital = 'District Hospital' } = (req.body || {});
  const number = ++db.tokensIssuedToday; // backend generates the token number
  const token = { id: db.tokens.length + 1, department, number, date, time, hospital, queue: 8 };
  db.tokens.push(token);
  pushNotification({ kind: 'Token confirmed', icon: 'ticket', title: `Token #${number} — ${department}`, body: `${hospital} · ${date} at ${time}.` });
  logAudit(`Token #${number} booked — ${department}`);
  ok(res, token);
});

app.get('/api/tokens/my', (_req, res) => ok(res, db.tokens));

// ── Records ──────────────────────────────────────────────────
app.get('/api/records', (_req, res) => ok(res, db.records));
app.get('/api/records/:id', (req, res) => {
  const record = db.records.find((r) => String(r.id) === req.params.id);
  if (!record) return fail(res, 404, 'Record not found.');
  ok(res, record);
});

// ── Medicines ────────────────────────────────────────────────
app.get('/api/medicines', (_req, res) => ok(res, db.medicines));

app.post('/api/medicines/:id/taken', (req, res) => {
  const medicine = db.medicines.find((m) => String(m.id) === req.params.id);
  if (!medicine) return fail(res, 404, 'Medicine not found.');
  medicine.status = 'taken';
  logAudit(`${medicine.name} marked as taken`);
  ok(res, medicine);
});

app.get('/api/medicines/adherence', (_req, res) => {
  const taken = db.medicines.filter((m) => m.status === 'taken').length;
  ok(res, { percent: db.medicines.length ? Math.round((taken / db.medicines.length) * 100) : 100, taken, total: db.medicines.length });
});

// ── Notifications ────────────────────────────────────────────
app.get('/api/notifications', (_req, res) => ok(res, db.notifications));

// ── Ayushman (demo endpoints — integration points only) ─────
app.get('/api/ayushman/card', (_req, res) => ok(res, db.ayushman));

app.post('/api/ayushman/eligibility', (req, res) => {
  const mobile = String((req.body && req.body.mobile) || '').replace(/\D/g, '');
  if (mobile.length !== 10) return fail(res, 400, 'Please enter a valid 10-digit mobile number.');
  ok(res, {
    result: 'may_be_eligible',
    disclaimer: 'Demo check — not an official verification. Real products use authorized PM-JAY APIs.',
    verified: false
  });
});

app.get('/api/ayushman/hospitals', (_req, res) => {
  ok(res, [
    { name: 'District Hospital', type: 'Government hospital', empanelled: true, distance: '2.1 km', address: 'Station Road, Sector 12 (demo address)' },
    { name: 'Community Health Centre', type: 'Government hospital', empanelled: true, distance: '5.4 km', address: 'Main Market Road (demo address)' },
    { name: 'City Care Hospital', type: 'Private hospital', empanelled: false, distance: '7.8 km', address: 'Civil Lines (demo address)' }
  ]);
});

// ── Consent & audit (demo) ───────────────────────────────────
app.get('/api/consent', (_req, res) => ok(res, { message: 'Demo consent endpoint — state lives on the client in the prototype.' }));
app.get('/api/audit', (_req, res) => ok(res, db.audit));

// ── AI (backend intent engine with safety layer) ─────────────
const EMERGENCY = ['emergency', 'chest pain', 'bleeding', 'unconscious', 'heart attack', 'saans'];
const UNSAFE = ['diagnose', 'what disease', 'do i have', 'interpret', 'dosage', 'dose of', 'prescribe', 'kitni goli', 'medicine should i take'];

app.post('/api/ai/ask', (req, res) => {
  const q = String((req.body && req.body.message) || '').toLowerCase();
  const has = (...words) => words.some((w) => q.includes(w));

  // Safety layer 1 — emergencies.
  if (has(...EMERGENCY)) {
    logAudit('AAS: emergency guidance shown');
    return ok(res, {
      message: 'If you believe this is an emergency, please seek immediate medical care right away. You can go to the nearest hospital emergency department.',
      intent: 'emergency', action: null, safety: 'emergency'
    });
  }
  // Safety layer 2 — refuse diagnosis / prescriptions.
  if (has(...UNSAFE)) {
    return ok(res, {
      message: "I can't diagnose a medical condition or suggest medicines. I can help you find the right healthcare service or department.",
      intent: 'out_of_scope', action: { label: 'Find a department', page: 'tokens' }, safety: 'refusal'
    });
  }
  // Ayushman navigation.
  if (has('ayushman', 'pmjay', 'pm-jay', 'aayush', 'आयुष्मान', 'card active')) {
    if (has('hospital', 'empanel')) return ok(res, { message: 'I can help you find an empanelled hospital near you. Here are the demo facilities.', intent: 'navigation', action: { label: 'Find hospital', page: 'hospitals' }, safety: 'normal' });
    if (has('benefit', 'coverage')) return ok(res, { message: 'You can see an easy overview of Ayushman benefits — hospitalization, treatment, diagnostics and more (demo information).', intent: 'navigation', action: { label: 'View benefits', page: 'benefits' }, safety: 'normal' });
    if (has('eligible', 'check')) return ok(res, { message: 'I can take you to the eligibility check. Remember: the prototype result is a demo, not official verification.', intent: 'navigation', action: { label: 'Check eligibility', page: 'eligibility' }, safety: 'normal' });
    return ok(res, { message: 'Your Ayushman Card status is Active (demo status). You can view the card details or find an empanelled hospital.', intent: 'information', action: { label: 'View card', page: 'ayushman' }, safety: 'normal' });
  }
  // Appointments.
  if (has('follow', 'appointment', 'next visit', 'kab hai')) {
    return ok(res, { message: 'Your next follow-up is on 15 September at General Medicine, District Hospital.', intent: 'appointment_information', action: { label: 'View token', page: 'confirmation' }, safety: 'normal' });
  }
  // Records.
  if (has('report', 'record', 'document', 'kagaz')) {
    return ok(res, { message: 'You can find your reports in Health Records — consultations, your CBC report and prescription are all in one timeline.', intent: 'navigation', action: { label: 'Open records', page: 'records' }, safety: 'normal' });
  }
  // Booking.
  if (has('token', 'book', 'queue')) {
    return ok(res, { message: 'You can book a hospital token in four short steps — hospital, department, date and time. Your next token number will be #27 (demo).', intent: 'navigation', action: { label: 'Book token', page: 'tokens' }, safety: 'normal' });
  }
  // Medicines.
  if (has('medicine', 'tablet', 'dawa', 'reminder')) {
    return ok(res, { message: 'Your medicines are in the Medicines section with morning, afternoon and night reminders. Medicine C is due at 8:00 PM today.', intent: 'navigation', action: { label: 'Open medicines', page: 'medicines' }, safety: 'normal' });
  }
  // Fallback.
  return ok(res, { message: `I can help you with tokens, records, medicines, reminders and Ayushman services, ${db.patient.firstName}. Try one of the suggestions below.`, intent: 'fallback', action: null, safety: 'normal' });
});

// 404 for unknown API routes.
app.use('/api', (_req, res) => fail(res, 404, 'Not found.'));

app.listen(PORT, '0.0.0.0', () => console.log(`AAS demo API running on http://localhost:${PORT}`));
