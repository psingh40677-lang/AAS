// ─────────────────────────────────────────────────────────────
// AAS · Advanced Alied Service — demo API server (Express)
// Prototype only: in-memory demo data, mock OTP, simulated
// Ayushman status. No real government/PM-JAY integration.
// ─────────────────────────────────────────────────────────────
const express = require('express');

const app = express();
const requestedPort = Number(process.env.PORT);
const PORT = requestedPort > 0 ? requestedPort : 3001;
app.use(express.json({ limit: '8mb' }));
const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
  next();
});

// ── Demo data (matches the frontend seed in src/data.js) ─────
const db = {
  patient: {
    name: 'Pooja Singh', firstName: 'Pooja', age: 19, gender: 'Female', height: 162,
    bloodGroup: 'AB+', mobile: '+91 98765 43210', address: 'Sector 12, New Delhi',
    emergencyContact: '+91 98765 00000', aadhaarNumber: '123456789012',
    ayushmanCardNumber: 'PMJAY1234567890'
  },
  tokens: [], // { id, department, number, token, date, time, queue, hospital, status }
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
  ,orders: [],
  wards: [
    { id: 'general-male', name: 'General Ward', unit: 'Male', gender: 'Male', prefix: 'G-M', capacity: 30 },
    { id: 'general-female', name: 'General Ward', unit: 'Female', gender: 'Female', prefix: 'G-F', capacity: 25 },
    { id: 'pediatric', name: 'Pediatric Ward', unit: 'Pediatric', gender: 'Unisex', prefix: 'PED', capacity: 15 },
    { id: 'icu', name: 'ICU', unit: 'ICU', gender: 'Unisex', prefix: 'ICU', capacity: 10 },
    { id: 'ventilator', name: 'Ventilator / Critical Care', unit: 'Ventilator', gender: 'Unisex', prefix: 'V', capacity: 5 },
    { id: 'nicu', name: 'NICU', unit: 'NICU', gender: 'Unisex', prefix: 'NICU', capacity: 8 },
    { id: 'emergency', name: 'Emergency', unit: 'Emergency', gender: 'Unisex', prefix: 'E', capacity: 12 }
  ],
  beds: [],
  admissions: []
};

db.medicalRecords = []; // { id, title, category, documentDate, notes, fields, ocrText, file, createdAt }

db.beds = db.wards.flatMap((ward) => Array.from({ length: ward.capacity }, (_unused, index) => ({
  id: `${ward.id}-${index + 1}`,
  wardId: ward.id,
  ward: ward.name,
  unit: ward.unit,
  gender: ward.gender,
  number: `${ward.prefix}-${String(index + 1).padStart(2, '0')}`,
  status: index < Math.floor(ward.capacity * 0.65) ? 'occupied' : 'available',
  patientName: index < Math.floor(ward.capacity * 0.65) ? 'Assigned patient' : '',
  updatedAt: new Date().toISOString()
})));

const ok = (res, data) => res.json({ success: true, data });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

const requireSession = (req, res, next) => {
  if (req.get('Authorization') !== 'Bearer demo-session-token') return fail(res, 401, 'Your session has expired. Please log in again.');
  next();
};

const requireStaff = (req, res, next) => {
  if (req.get('Authorization') !== 'Bearer demo-session-token' || !['demo-pharmacy-staff', 'demo-hospital-staff'].includes(req.get('X-AAS-Staff'))) return fail(res, 403, 'Authorized hospital staff access is required.');
  next();
};

const maskValue = (value, visibleDigits = 4) => {
  const compact = String(value || '').replace(/\s/g, '');
  return compact ? `${'X'.repeat(Math.max(compact.length - visibleDigits, 0))}${compact.slice(-visibleDigits)}` : '';
};
const maskAadhaar = (value) => {
  const compact = String(value || '').replace(/\D/g, '');
  return compact ? `XXXX-XXXX-${compact.slice(-4)}` : '';
};

const publicPatient = () => {
  const { aadhaarNumber, ayushmanCardNumber, ...safePatient } = db.patient;
  return { ...safePatient, aadhaarNumber: maskAadhaar(aadhaarNumber), ayushmanCardNumber: maskValue(ayushmanCardNumber) };
};

const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const validPhone = (value) => /^(?:\d{10}|91\d{10})$/.test(String(value || '').replace(/\D/g, ''));
const validateProfile = (profile) => {
  if (!String(profile.name || '').trim()) return 'Patient name is required.';
  if (!Number.isInteger(Number(profile.age)) || Number(profile.age) < 0 || Number(profile.age) > 120) return 'Age must be between 0 and 120.';
  if (!['Female', 'Male', 'Other', 'Prefer not to say'].includes(profile.gender)) return 'Please select a valid gender.';
  if (!Number.isFinite(Number(profile.height)) || Number(profile.height) < 40 || Number(profile.height) > 250) return 'Height must be between 40 and 250 cm.';
  if (!validBloodGroups.includes(profile.bloodGroup)) return 'Please select a valid blood group.';
  if (!validPhone(profile.mobile)) return 'Mobile number must contain 10 digits, with an optional +91 prefix.';
  if (!validPhone(profile.emergencyContact)) return 'Emergency contact must contain 10 digits, with an optional +91 prefix.';
  if (String(profile.address || '').trim().length < 5) return 'Please enter a complete address.';
  if (profile.aadhaarNumber !== undefined && profile.aadhaarNumber !== '' && !/^\d{12}$/.test(String(profile.aadhaarNumber))) return 'Aadhaar number must be exactly 12 digits.';
  if (profile.ayushmanCardNumber !== undefined && profile.ayushmanCardNumber !== '' && !/^[A-Z0-9/-]{6,30}$/i.test(String(profile.ayushmanCardNumber))) return 'Ayushman card number must be 6-30 letters or numbers.';
  return '';
};

const logAudit = (text) => {
  db.audit.unshift({ id: db.audit.length + 1 + Math.random(), time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), text });
};

const pushNotification = (n) => {
  db.notifications.unshift({ id: db.notifications.length + 1 + Math.random(), unread: true, ...n });
};

const ORDER_STATUSES = ['Prescription Uploaded', 'Under Verification', 'Approved', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Prescription Verification Failed'];
const STAFF_STATUSES = ['Approved', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered'];
const allowedPrescriptionTypes = ['image/jpeg', 'image/png', 'application/pdf'];
const orderView = (order, includeFile = false) => {
  const { prescription, ...safeOrder } = order;
  return { ...safeOrder, prescription: includeFile ? prescription : { name: prescription.name, type: prescription.type, size: prescription.size } };
};
const makeOrderId = () => `AAS-${String(Date.now()).slice(-6)}${Math.floor(Math.random() * 10)}`;
const validateOrder = (payload) => {
  if (!payload.patient?.name || !payload.patient?.mobile || !payload.patient?.address) return 'Patient name, mobile number and delivery address are required.';
  if (!payload.prescription?.name || !allowedPrescriptionTypes.includes(payload.prescription.type)) return 'Please upload a JPG, PNG or PDF prescription.';
  if (!payload.prescription.data || Number(payload.prescription.size) > 6 * 1024 * 1024) return 'Prescription file is missing or too large.';
  if (!Array.isArray(payload.medicines) || !payload.medicines.length) return 'Add at least one medicine or prescription item.';
  if (!payload.medicines.every((item) => item.name && Number(item.quantity) > 0)) return 'Each medicine needs a name and quantity.';
  if (!['delivery', 'pickup'].includes(payload.fulfillment)) return 'Choose delivery or pickup.';
  return '';
};

const BED_STATUSES = ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'];
const publicBed = (bed) => ({ id: bed.id, wardId: bed.wardId, ward: bed.ward, unit: bed.unit, gender: bed.gender, number: bed.number, status: bed.status, updatedAt: bed.updatedAt });
const bedSnapshot = (includePrivate = false) => {
  const beds = db.beds.map((bed) => includePrivate ? { ...publicBed(bed), patientName: bed.patientName || '' } : publicBed(bed));
  const wards = db.wards.map((ward) => {
    const wardBeds = beds.filter((bed) => bed.wardId === ward.id);
    const counts = wardBeds.reduce((result, bed) => { result[bed.status] += 1; return result; }, { available: 0, occupied: 0, reserved: 0, cleaning: 0, maintenance: 0 });
    return { ...ward, total: wardBeds.length, occupied: counts.occupied, available: counts.available, reserved: counts.reserved, cleaning: counts.cleaning, maintenance: counts.maintenance, availableBedNumbers: wardBeds.filter((bed) => bed.status === 'available').map((bed) => bed.number), beds: includePrivate ? wardBeds : undefined };
  });
  const totals = wards.reduce((result, ward) => {
    result.total += ward.total; result.occupied += ward.occupied; result.available += ward.available; result.reserved += ward.reserved; result.cleaning += ward.cleaning; result.maintenance += ward.maintenance; return result;
  }, { total: 0, occupied: 0, available: 0, reserved: 0, cleaning: 0, maintenance: 0 });
  return { totals, wards, lastUpdated: new Date().toISOString() };
};
const findBed = (id) => db.beds.find((bed) => bed.id === id);
const updateBed = (bed, status, patientName = '') => {
  bed.status = status;
  bed.patientName = status === 'occupied' ? patientName : '';
  bed.updatedAt = new Date().toISOString();
};

const formatToken = (number) => `A-${String(number).padStart(3, '0')}`;

const queueStatus = () => {
  const serving = db.tokens.find((token) => token.status === 'serving') || null;
  const waiting = db.tokens.filter((token) => token.status === 'waiting');
  return {
    nowServing: serving,
    nextToken: waiting[0] || null,
    waitingCount: waiting.length,
    queue: db.tokens,
    updatedAt: new Date().toISOString()
  };
};

const transitionNextToken = () => {
  const serving = db.tokens.find((token) => token.status === 'serving');
  if (serving) serving.status = 'completed';
  const next = db.tokens.find((token) => token.status === 'waiting');
  if (!next) return null;
  if (serving) {
    serving.status = 'completed';
    serving.completedAt = new Date().toISOString();
  }
  next.status = 'serving';
  next.calledAt = new Date().toISOString();
  return next;
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
  ok(res, { token: 'demo-session-token', patient: publicPatient() });
});

// ── Patient profile (protected demo session) ─────────────────
app.get('/api/profile', requireSession, (_req, res) => ok(res, publicPatient()));

app.put('/api/profile', requireSession, (req, res) => {
  const incoming = req.body || {};
  const profile = {
    ...db.patient,
    ...incoming,
    name: String(incoming.name ?? db.patient.name).trim(),
    age: Number(incoming.age ?? db.patient.age),
    height: Number(incoming.height ?? db.patient.height),
    mobile: String(incoming.mobile ?? db.patient.mobile).trim(),
    emergencyContact: String(incoming.emergencyContact ?? db.patient.emergencyContact).trim(),
    address: String(incoming.address ?? db.patient.address).trim()
  };
  if (incoming.aadhaarNumber === '') profile.aadhaarNumber = db.patient.aadhaarNumber;
  if (incoming.ayushmanCardNumber === '') profile.ayushmanCardNumber = db.patient.ayushmanCardNumber;
  const validationError = validateProfile(profile);
  if (validationError) return fail(res, 400, validationError);
  profile.firstName = profile.name.split(/\s+/)[0];
  db.patient = profile;
  logAudit('Patient profile updated');
  ok(res, publicPatient());
});

// ── Real-time ward and bed availability ─────────────────────
app.get('/api/beds/availability', (_req, res) => ok(res, bedSnapshot(false)));

app.get('/api/staff/beds', requireStaff, (_req, res) => ok(res, bedSnapshot(true)));

app.post('/api/staff/wards', requireStaff, (req, res) => {
  const { name, unit, gender = 'Unisex', prefix } = req.body || {};
  if (!String(name || '').trim() || !String(unit || '').trim() || !String(prefix || '').trim()) return fail(res, 400, 'Ward name, unit and prefix are required.');
  if (db.wards.some((ward) => ward.id === String(unit).toLowerCase().replace(/\s+/g, '-'))) return fail(res, 409, 'That ward already exists.');
  const id = String(unit).toLowerCase().replace(/\s+/g, '-');
  db.wards.push({ id, name: String(name).trim(), unit: String(unit).trim(), gender, prefix: String(prefix).trim().toUpperCase(), capacity: 0 });
  ok(res, bedSnapshot(true));
});

app.post('/api/staff/beds', requireStaff, (req, res) => {
  const { wardId, number, gender = 'Unisex' } = req.body || {};
  const ward = db.wards.find((item) => item.id === wardId);
  if (!ward) return fail(res, 400, 'Select a valid ward.');
  if (!String(number || '').trim()) return fail(res, 400, 'Bed number is required.');
  if (db.beds.some((bed) => bed.number.toLowerCase() === String(number).trim().toLowerCase())) return fail(res, 409, 'That bed number already exists.');
  const bed = { id: `${wardId}-${Date.now()}`, wardId, ward: ward.name, unit: ward.unit, gender, number: String(number).trim(), status: 'available', patientName: '', updatedAt: new Date().toISOString() };
  db.beds.push(bed);
  ok(res, bedSnapshot(true));
});

app.put('/api/staff/beds/:id', requireStaff, (req, res) => {
  const bed = findBed(req.params.id);
  if (!bed) return fail(res, 404, 'Bed not found.');
  const { status, patientName = '', wardId } = req.body || {};
  if (status && !BED_STATUSES.includes(status)) return fail(res, 400, 'Invalid bed status.');
  if (wardId && !db.wards.some((ward) => ward.id === wardId)) return fail(res, 400, 'Invalid destination ward.');
  if (status === 'occupied' && !String(patientName).trim()) return fail(res, 400, 'Patient name is required for an occupied bed.');
  if (status && ['occupied', 'reserved'].includes(status) && !['available', 'cleaning', 'maintenance'].includes(bed.status)) return fail(res, 409, 'This bed is already occupied or reserved.');
  if (wardId && wardId !== bed.wardId) {
    const destination = db.beds.filter((item) => item.wardId === wardId && item.status === 'available')[0];
    if (!destination) return fail(res, 409, 'No available bed exists in the destination ward.');
    updateBed(destination, 'occupied', patientName || bed.patientName);
    updateBed(bed, 'available');
  } else if (status) updateBed(bed, status, patientName);
  ok(res, bedSnapshot(true));
});

app.delete('/api/staff/beds/:id', requireStaff, (req, res) => {
  const bed = findBed(req.params.id);
  if (!bed) return fail(res, 404, 'Bed not found.');
  if (bed.status === 'occupied' || bed.status === 'reserved') return fail(res, 409, 'Occupied or reserved beds cannot be deactivated.');
  db.beds = db.beds.filter((item) => item.id !== bed.id);
  ok(res, bedSnapshot(true));
});

app.post('/api/staff/admissions', requireStaff, (req, res) => {
  const { patientName, wardId, bedId } = req.body || {};
  const bed = findBed(bedId);
  if (!String(patientName || '').trim() || !bed || bed.wardId !== wardId) return fail(res, 400, 'Patient, ward and bed are required.');
  if (bed.status !== 'available') return fail(res, 409, 'That bed is no longer available. Please choose another bed.');
  updateBed(bed, 'occupied', patientName);
  const admission = { id: `ADM-${Date.now().toString().slice(-6)}`, patientName: String(patientName).trim(), wardId, bedId, status: 'Admitted', createdAt: new Date().toISOString() };
  db.admissions.unshift(admission);
  ok(res, { admission, availability: bedSnapshot(true) });
});

// ── Pharmacy orders (protected demo workflow) ───────────────
app.post('/api/pharmacy/orders', requireSession, (req, res) => {
  const validationError = validateOrder(req.body || {});
  if (validationError) return fail(res, 400, validationError);
  const order = {
    id: makeOrderId(),
    patient: { ...req.body.patient },
    prescription: { ...req.body.prescription },
    medicines: req.body.medicines.map((item) => ({ name: String(item.name).trim(), strength: String(item.strength || '').trim(), quantity: Number(item.quantity), instructions: String(item.instructions || '').trim(), availability: 'Pending pharmacist check' })),
    notes: String(req.body.notes || '').trim(),
    fulfillment: req.body.fulfillment,
    estimatedPrice: Number(req.body.estimatedPrice) || 0,
    totalAmount: Number(req.body.totalAmount) || 0,
    status: 'Under Verification',
    statusHistory: [
      { status: 'Prescription Uploaded', at: new Date().toISOString() },
      { status: 'Under Verification', at: new Date().toISOString() }
    ],
    rejectionReason: '',
    createdAt: new Date().toISOString()
  };
  db.orders.unshift(order);
  logAudit(`Pharmacy order ${order.id} received for verification`);
  ok(res, orderView(order));
});

app.get('/api/pharmacy/orders/:id', requireSession, (req, res) => {
  const order = db.orders.find((item) => item.id === req.params.id);
  if (!order) return fail(res, 404, 'Pharmacy order not found.');
  ok(res, orderView(order));
});

app.get('/api/pharmacy/orders/:id/prescription', requireSession, (req, res) => {
  const order = db.orders.find((item) => item.id === req.params.id);
  if (!order) return fail(res, 404, 'Pharmacy order not found.');
  ok(res, order.prescription);
});

app.get('/api/pharmacy/staff/orders', requireStaff, (_req, res) => ok(res, db.orders.map((order) => orderView(order, true))));

app.put('/api/pharmacy/staff/orders/:id', requireStaff, (req, res) => {
  const order = db.orders.find((item) => item.id === req.params.id);
  if (!order) return fail(res, 404, 'Pharmacy order not found.');
  const { status, reason = '', medicines } = req.body || {};
  if (![...STAFF_STATUSES, 'Prescription Verification Failed'].includes(status)) return fail(res, 400, 'Invalid pharmacy order status.');
  if (status === 'Prescription Verification Failed' && !String(reason).trim()) return fail(res, 400, 'A rejection reason is required.');
  if (Array.isArray(medicines)) order.medicines = medicines.map((item) => ({ ...item, quantity: Number(item.quantity), availability: String(item.availability || 'Available') }));
  order.status = status;
  order.rejectionReason = status === 'Prescription Verification Failed' ? String(reason).trim() : '';
  order.statusHistory.push({ status, at: new Date().toISOString(), reason: order.rejectionReason });
  logAudit(`Pharmacy order ${order.id} updated to ${status}`);
  ok(res, orderView(order, true));
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
  const waitingAhead = db.tokens.filter((item) => item.status === 'waiting').length;
  const token = { id: db.tokens.length + 1, department, number, token: formatToken(number), date, time, hospital, queue: waitingAhead, status: 'waiting', createdAt: new Date().toISOString() };
  db.tokens.push(token);
  pushNotification({ kind: 'Token confirmed', icon: 'ticket', title: `Token #${number} — ${department}`, body: `${hospital} · ${date} at ${time}.` });
  logAudit(`Token #${number} booked — ${department}`);
  ok(res, token);
});

app.get('/api/tokens/my', (_req, res) => ok(res, db.tokens));

// ── Live queue ──────────────────────────────────────────────
app.get('/api/queue/status', (_req, res) => ok(res, queueStatus()));

app.post('/api/queue/next', (_req, res) => {
  const next = transitionNextToken();
  if (!next) return fail(res, 409, 'There are no waiting tokens in the queue.');
  logAudit(`${next.token} called next`);
  ok(res, queueStatus());
});

const updateTokenStatus = (status) => (req, res) => {
  const token = db.tokens.find((item) => String(item.id) === req.params.id);
  if (!token) return fail(res, 404, 'Token not found.');
  token.status = status;
  token.updatedAt = new Date().toISOString();
  logAudit(`${token.token} marked ${status}`);
  ok(res, queueStatus());
};

app.post('/api/queue/:id/complete', updateTokenStatus('completed'));
app.post('/api/queue/:id/skip', updateTokenStatus('skipped'));
app.post('/api/queue/:id/cancel', updateTokenStatus('cancelled'));

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

// ── Ask AAS — AI Health Assistant (safe, multilingual) ──────
// Optional: set AI_API_KEY (OpenAI-compatible chat API) to get real
// AI answers. The key NEVER leaves the backend. Without a key the
// safe built-in guidance engine below answers (demo mode — no fake AI).
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_API_URL = (process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions').replace(/\/+$/, '');
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const AI_LANGUAGE_NAMES = ['English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Kannada', 'Malayalam', 'Odia', 'Punjabi', 'Assamese', 'Urdu'];

// Multilingual safe guidance templates (offline / demo engine).
const G = (disclaimer, urgent, fever, cough, throat, dehydration, headache, stomach, wound, medicineSafety, whenDoctor, general, recordIntro, recordNotDiagnosis, recordNone) => ({ disclaimer, urgent, fever, cough, throat, dehydration, headache, stomach, wound, medicineSafety, whenDoctor, general, recordIntro, recordNotDiagnosis, recordNone });

const HEALTH_GUIDANCE = {
  English: G('AI-generated information is for general guidance only and is not a substitute for professional medical advice.', 'Your question may point to a serious problem. Please seek medical care immediately — go to the nearest hospital emergency department or call your local emergency number right away.', 'For fever, rest well and drink plenty of fluids. Keep the body cool with light clothing and lukewarm sponging. The right medicine and its dose depend on your age, symptoms, allergies, existing conditions and other medicines — so please ask a doctor or pharmacist before taking anything. See a doctor if the fever lasts more than 3 days, is very high, or comes with rash, stiff neck, confusion or breathing difficulty.', 'For cough and cold, warm fluids, rest and steam inhalation usually help. Honey can soothe the throat (not for children under 1 year). See a doctor if you have breathlessness, chest pain, blood in the cough, or symptoms lasting more than 2 weeks.', 'For a sore throat, warm salt-water gargles, warm drinks and rest usually help. Most sore throats settle in a few days. See a doctor if swallowing becomes very difficult, fever is high, or one side of the throat is severely painful or swollen.', 'For dehydration, sip water or ORS (oral rehydration solution) frequently and rest in a cool place. Watch for dry mouth, very dark urine, dizziness or passing very little urine. Babies, elderly people, and anyone who cannot keep fluids down or becomes drowsy should be taken to a doctor quickly.', 'For a common headache, rest in a quiet, dim room, drink water and stay away from screens. Get medical help right away for a sudden severe headache, headache after a head injury, or headache with fever and stiff neck, blurred vision, weakness or vomiting.', 'For common stomach problems, light food, plenty of water and rest usually help. Keep taking ORS if you have diarrhea or vomiting. Go to a doctor right away for blood in vomit or stool, severe pain, high fever, or if you cannot keep fluids down.', 'Wash a small wound with clean running water and cover it with a clean cloth or bandage. See a doctor quickly for a deep wound, heavy bleeding, swelling or pus, or any animal bite (risk of tetanus/rabies).', 'The right medicine and dose depend on your age, weight, symptoms, allergies, existing conditions, pregnancy and other medicines — so I cannot name a medicine or a dose. Please consult a qualified doctor or pharmacist. Never start, change or stop a medicine on your own.', 'See a doctor promptly if symptoms get worse or last long, you have high fever, trouble breathing, chest pain, fainting, repeated vomiting, blood in urine or stool, or you are worried about a baby, a pregnant woman or an elderly person. When in doubt, getting checked early is always safer.', 'I can share general health information — for example about fever, cough, dehydration, medicine timing or understanding reports. I cannot diagnose diseases or prescribe medicines. For personal advice, please consult a qualified doctor. You can also book a token or ask me about your saved Medical Records.', 'Here is the information recorded in this document:', 'This is only an explanation of the document — not a medical diagnosis. Please discuss the findings and next steps with your doctor.', 'I could not clearly read the details of this document. You can open the record to view the original file, or edit the details to correct them.'),
  Hindi: G('एआई (AI) से मिली जानकारी केवल सामान्य मार्गदर्शन के लिए है। यह डॉक्टर की सलाह का विकल्प नहीं है।', 'आपका सवाल गंभीर समस्या का संकेत हो सकता है। कृपया तुरंत नज़दीकी अस्पताल की इमरजेंसी में जाएँ या आपातकालीन नंबर पर कॉल करें।', 'बुखार में आराम करें और खूब तरल (पानी, सूप, ORS) लें। हल्के कपड़े पहनें और गुनगुने पानी से पोंछा लगाएँ। कौन-सी दवा और कितनी मात्रा लेनी चाहिए, यह आपकी उम्र, लक्षणों, एलर्जी और दूसरी दवाओं पर निर्भर करता है — इसलिए दवा लेने से पहले डॉक्टर या फार्मासिस्ट से सलाह लें। बुखार 3 दिन से ज़्यादा रहे, बहुत ज़्यादा हो, या साथ में रैश, गर्दन में अकड़न, बेहोशी जैसी हालत या सांस लेने में तकलीफ़ हो तो डॉक्टर से मिलें।', 'खांसी-ज़ुकाम में गुनगुना पानी, आराम और भाप लेना आराम देता है। गले के लिए शहद राहत दे सकता है (1 साल से छोटे बच्चों को शहद न दें)। सांस फूलना, सीने में दर्द, खांसी में खून या 2 हफ़्ते से ज़्यादा लक्षण हों तो डॉक्टर से मिलें।', 'गले में दर्द में गुनगुने नमक-पानी से गरारे करें, गर्म तरल लें और आराम करें। ज़्यादातर गले का दर्द कुछ दिनों में ठीक हो जाता है। निगलने में बहुत तकलीफ़, तेज़ बुखार या गले की एक तरफ़ ज़्यादा दर्द/सूजन हो तो डॉक्टर से मिलें।', 'पानी की कमी (डिहाइड्रेशन) में बार-बार थोड़ा-थोड़ा पानी या ORS पिएँ और ठंडी जगह आराम करें। सूखा मुँह, गहरा पीला पेशाब, चक्कर आना या बहुत कम पेशाब आना चेतावनी है। छोटे बच्चे, बुज़ुर्ग, या जिन्हें पानी पीते ही उल्टी हो जाए या होश कम हो — उन्हें जल्दी डॉक्टर के पास ले जाएँ।', 'सामान्य सिरदर्द में शांत, कम रोशनी वाली जगह आराम करें, पानी पिएँ और मोबाइल/स्क्रीन से दूरी बनाएँ। अचानक बहुत तेज़ सिरदर्द, सिर की चोट के बाद दर्द, बुखार के साथ गर्दन में अकड़न, धुंधला दिखना, कमज़ोरी या उल्टी हो तो तुरंत डॉक्टर से मिलें।', 'पेट की सामान्य तकलीफ़ में हल्का खाना, खूब पानी और आराम से फ़ायदा होता है। दस्त/उल्टी में ORS लेते रहें। खून वाला दस्त/उल्टी, तेज़ दर्द, तेज़ बुखार, या पानी भी न रुकने पर डॉक्टर से तुरंत मिलें।', 'छोटे घाव को साफ बहते पानी से धोएँ और साफ कपड़े/पट्टी से ढकें। गहरा घाव, बहुत खून, सूजन-मवाद, या जानवर का काटना (टिटनेस/रैबीज़ का खतरा) हो तो जल्दी डॉक्टर से मिलें।', 'सही दवा और खुराक आपकी उम्र, वज़न, लक्षणों, एलर्जी, मौजूदा बीमारियों, गर्भावस्था और अन्य दवाओं पर निर्भर करती है — इसलिए मैं दवा का नाम या मात्रा बता नहीं सकता। कृपया योग्य डॉक्टर या फार्मासिस्ट से पूछें। कोई भी दवा खुद बदलें या बंद न करें।', 'डॉक्टर से कब मिलें: लक्षण बढ़ें या लंबे समय तक रहें, तेज़ बुखार, सांस लेने में तकलीफ़, सीने में दर्द, बेहोशी, बार-बार उल्टी, पेशाब/मल में खून, या छोटे बच्चे/गर्भवती महिला/बुज़ुर्ग को लेकर चिंता हो। शक हो तो जल्दी जाँच कराना हमेशा बेहतर है।', 'मैं सामान्य स्वास्थ्य जानकारी दे सकता हूँ — जैसे बुखार, खांसी, पानी की कमी, दवा का समय या रिपोर्ट समझने के बारे में। मैं बीमारी की पहचान (डायग्नोसिस) या दवा नहीं बता सकता। निजी सलाह के लिए योग्य डॉक्टर से मिलें। आप टोकन बुक कर सकते हैं या अपने मेडिकल रिकॉर्ड के बारे में पूछ सकते हैं।', 'इस दस्तावेज़ में दर्ज जानकारी:', 'यह केवल दस्तावेज़ की जानकारी समझाना है — यह मेडिकल डायग्नोसिस नहीं है। रिपोर्ट और अगले कदमों के लिए अपने डॉक्टर से सलाह लें।', 'मैं इस दस्तावेज़ की जानकारी साफ नहीं पढ़ सका। आप रिकॉर्ड खोलकर मूल फाइल देख सकते हैं या जानकारी खुद जोड़/सुधार सकते हैं।'),
  Bengali: G('এআই (AI) থেকে পাওয়া তথ্য শুধুমাত্র সাধারণ নির্দেশনার জন্য। এটি ডাক্তারের পরামর্শের বিকল্প নয়।', 'আপনার প্রশ্নটি গুরুতর সমস্যার ইঙ্গিত হতে পারে। দয়া করে এখনই নিকটস্থ হাসপাতালের ইমার্জেন্সিতে যান।', 'জ্বরে বিশ্রাম নিন এবং প্রচুর তরল (পানি, স্যুপ, ORS) পান করুন। হালকা পোশাক পরুন এবং হালকা গরম জল দিয়ে মুছে নিন। কোন ওষুধ ও কত মাত্রা নেবেন তা আপনার বয়স, লক্ষণ, অ্যালার্জি ও অন্য ওষুধের ওপর নির্ভর করে — তাই ওষুধ নেওয়ার আগে ডাক্তার বা ফার্মাসিস্টের পরামর্শ নিন। ৩ দিনের বেশি জ্বর, খুব বেশি জ্বর, র‍্যাশ, ঘাড় শক্ত হওয়া, বিভ্রান্তি বা শ্বাসকষ্ট হলে ডাক্তার দেখান।', 'কাশি-সর্দিতে গরম জল, বিশ্রাম ও ভাপ নেওয়া আরাম দেয়। মধু গলে আরাম দিতে পারে (১ বছরের কম বাচ্চাদের মধু দেবেন না)। শ্বাসকষ্ট, বুকে ব্যথা, কফের সঙ্গে রক্ত বা ২ সপ্তাহের বেশি লক্ষণ থাকলে ডাক্তার দেখান।', 'গলার ব্যথায় হালকা গরম লবণ-জল দিয়ে গার্গল করুন, গরম তরল পান করুন ও বিশ্রাম নিন। গিলতে খুব কষ্ট, প্রচণ্ড জ্বর বা গলার একপাশে তীব্র ব্যথা/ফোলা হলে ডাক্তার দেখান।', 'পানিশূন্যতায় অল্প অল্প করে জল বা ORS পান করুন ও ঠান্ডা জায়গায় বিশ্রাম নিন। শুকনো মুখ, গাঢ় হলুদ প্রস্রাব, মাথা ঘোরা বা খুব কম প্রস্রাব সতর্ক চিহ্ন। শিশু, বয়স্ক, বা যাঁর জল নামানোই যায় না বা অজ্ঞানসম হয়ে যায় — তাঁদের দ্রুত ডাক্তারের কাছে নিন।', 'সাধারণ মাথাব্যথায় শান্ত, কম আলোর ঘরে বিশ্রাম নিন, জল পান করুন ও স্ক্রিন থেকে দূরে থাকুন। হঠাৎ প্রচণ্ড মাথাব্যথা, মাথায় আঘাতের পরে ব্যথা, জ্বরের সঙ্গে ঘাড় শক্ত, চোখে ঝাপসা দেখা, দুর্বলতা বা বমি হলে তৎক্ষণাৎ ডাক্তার দেখান।', 'পেটের সাধারণ সমস্যায় হালকা খাবার, প্রচুর জল ও বিশ্রামে আরাম আসে। ডায়রিয়া/বমি হলে ORS চালিয়ে যান। রক্তযুক্ত বমি/মল, প্রচণ্ড ব্যথা, প্রচণ্ড জ্বর বা জলও না থামলে দ্রুত ডাক্তারের কাছে যান।', 'ছোট ক্ষত পরিষ্কার বহমান জলে ধুয়ে পরিষ্কার কাপড়/ব্যান্ডেজ দিয়ে ঢেকে দিন। গভীর ক্ষত, অনেক রক্তপাত, ফোলা/পুঁজ, বা পশুর কামড় (টিটেনাস/রেবিসের ঝুঁকি) হলে দ্রুত ডাক্তার দেখান।', 'সঠিক ওষুধ ও মাত্রা নির্ভর করে আপনার বয়স, ওজন, লক্ষণ, অ্যালার্জি, বর্তমান রোগ, গর্ভাবস্থা ও অন্য ওষুধের ওপর — তাই আমি ওষুধের নাম বা মাত্রা বলতে পারি না। যোগ্য ডাক্তার বা ফার্মাসিস্টের পরামর্শ নিন। নিজে থেকে ওষুধ বদলাবেন বা বন্ধ করবেন না।', 'ডাক্তার কখন দেখাবেন: লক্ষণ বাড়লে বা দীর্ঘদিন থাকলে, প্রচণ্ড জ্বর, শ্বাসকষ্ট, বুকে ব্যথা, অজ্ঞান হওয়া, বারবার বমি, প্রস্রাব/মলে রক্ত, বা শিশু/গর্ভবতী/বয়স্কের অসুখে চিন্তা হলে। সন্দেহ থাকলে আগে পরীক্ষা করানোই নিরাপদ।', 'আমি সাধারণ স্বাস্থ্য-তথ্য দিতে পারি — যেমন জ্বর, কাশি, পানিশূন্যতা, ওষুধের সময় বা রিপোর্ট বোঝা। আমি রোগ নির্ণয় বা ওষুধ দিতে পারি না। ব্যক্তিগত পরামর্শের জন্য ডাক্তার দেখান। আপনি টোকেন বুক করতে পারেন বা আপনার মেডিকেল রেকর্ড সম্পর্কে জিজ্ঞেস করতে পারেন।', 'এই নথিতে যা লেখা আছে:', 'এটি শুধু নথির তথ্য বোঝানো মাত্র — এটি চিকিৎসাগত রোগনির্ণয় নয়। রিপোর্ট ও পরবর্তী পদক্ষেপের জন্য ডাক্তারের পরামর্শ নিন।', 'এই নথির তথ্য আমি স্পষ্টভাবে পড়তে পারিনি। আপনি রেকর্ড খুলে মূল ফাইল দেখতে পারেন বা তথ্য নিজে যোগ/সংশোধন করতে পারেন।'),
  Telugu: G('AI సమాచారం సాధారణ సూచన కోసం మాత్రమే. ఇది వైద్యుని సలహాకు ప్రత్యామ్నాయం కాదు.', 'మీ ప్రశ్న తీవ్రమైన సమస్యను సూచించవచ్చు. దయచేసి వెంటనే సమీప ఆసుపత్రి ఎమర్జెన్సీకి వెళ్లండి.', 'జ్వరంలో విశ్రాంతి తీసుకోండి, పుష్కలంగా నీరు/ద్రవాలు త్రాగండి. ఏ మందు, ఎంత మోతాదు అనేది మీ వయసు, లక్షణాలు, అలర్జీలు, ఇతర మందులపై ఆధారపడి ఉంటుంది — కాబట్టి మందు వాడే ముందు వైద్యుడిని లేదా ఫార్మసిస్ట్‌ను అడగండి. జ్వరం 3 రోజుల కంటే ఎక్కువ ఉంటే, చాలా ఎక్కువగా ఉంటే, లేదా దద్దుర్లు, మెడ బిగుతు, గొణుగుడు, శ్వాస సమస్యలు ఉంటే వైద్యుడిని కలవండి.', 'దగ్గు, జలుబులో వేడి ద్రవాలు, విశ్రాంతి, ఆవిరి తీసుకోవడం ఉపశమనం ఇస్తాయి. తేనె గొంతుకకు మెత్తగా ఉంటుంది (1 ఏళ్ల లోపు పిల్లలకు తేనె ఇవ్వకండి). శ్వాస ఆడకపోవడం, ఛాతి నొప్పి, దగ్గులో రక్తం లేదా 2 వారాల కంటే ఎక్కువ లక్షణాలు ఉంటే వైద్యుడిని కలవండి.', 'గొంతు నొప్పిలో గోరువెచ్చని ఉప్పునీటితో పుక్కిలించండి, వేడి ద్రవాలు తీసుకోండి, విశ్రాంతి తీసుకోండి. మింగడం చాలా కష్టం, పెద్ద జ్వరం, లేదా గొంతు ఒక వైపు తీవ్ర నొప్పి/వాపు ఉంటే వైద్యుడిని కలవండి.', 'నీటి లోపంలో కొద్దికొద్దిగా నీరు లేదా ORS త్రాగుతూ చల్లని చోట విశ్రాంతి తీసుకోండి. పొడి నోరు, ముదురు పసుపు మూత్రం, తల తిరగడం, చాలా తక్కువ మూత్రం అనేవి హెచ్చరిక సంకేతాలు. పిల్లలు, పెద్దలు, లేదా ద్రవాలు తాగనివ్వకూడని వారిని వెంటనే వైద్యుడి దగ్గరకు తీసుకెళ్లండి.', 'సాధారణ తలనొప్పిలో ప్రశాంత, మంచి వెలుతురు లేని చోట విశ్రాంతి తీసుకోండి, నీరు త్రాగండి, స్క్రీన్లకు దూరంగా ఉండండి. హఠాత్తుగా అతి తీవ్ర నొప్పి, గాయం తర్వాత, జ్వరంతో మెడ బిగుతు, కళ్లు మసక, బలహీనత లేదా వాంతులు ఉంటే వెంటనే వైద్యుడిని కలవండి.', 'సాధారణ కడుపు సమస్యల్లో తేలికపాటి భోజనం, నీరు, విశ్రాంతి ఉపశమనం ఇస్తాయి. విరోచనాలు/వాంతుల్లో ORS తీసుకుంటూ ఉండండి. రక్తంతో కూడిన వాంతులు/మలం, తీవ్ర నొప్పి, ఎక్కువ జ్వరం, లేదా ద్రవాలు ఆగకపోతే వెంటనే వైద్యుడిని కలవండి.', 'చిన్న గాయాన్ని శుభ్రమైన పరుగునీటితో కడగండి, శుభ్రమైన గుడ్డతో కప్పండి. లోతైన గాయం, ఎక్కువ రక్తస్రావం, వాపు/చీము, లేదా జంతువు కాటు ఉంటే త్వరగా వైద్యుడిని కలవండి.', 'సరైన మందు మరియు మోతాదు మీ వయసు, బరువు, లక్షణాలు, అలర్జీలు, ఇతర వ్యాధులు, గర్భధారణ మరియు ఇతర మందులపై ఆధారపడి ఉంటుంది — అందుకే నేను మందు పేరు లేదా మోతాదు సిఫార్సు చేయలేను. అర్హత కలిగిన వైద్యుడిని లేదా ఫార్మసిస్ట్‌ను సంప్రదించండి. మీరే మందులు మార్చవద్దు లేదా ఆపవద్దు.', 'వైద్యుడిని ఎప్పుడు కలవాలి: లక్షణాలు పెరిగినా లేదా ఎక్కువ కాలం ఉంటే, తీవ్ర జ్వరం, శ్వాస సమస్య, ఛాతి నొప్పి, మైకమి, వరుస వాంతులు, మూత్రం/మలంలో రక్తం, లేదా పిల్లలు/గర్భిణీ స్త్రీలు/పెద్దల ఆరోగ్యం గురించి ఆందోళన ఉంటే. అనుమానం ఉంటే ముందుగానే పరీక్ష చేయించుకోవడం సురక్షితం.', 'నేను సాధారణ ఆరోగ్య సమాచారం ఇవ్వగలను — జ్వరం, దగ్గు, నీటి లోపం, మందుల సమయం, రిపోర్ట్ అర్థం చేసుకోవడం వంటివి. నేను రోగనిర్ధారణ లేదా మందులు సూచించలేను. వ్యక్తిగత సలహా కోసం వైద్యుడిని కలవండి. మీరు టోకెన్ బుక్ చేయవచ్చు లేదా మీ మెడికల్ రికార్డ్స్ గురించి అడగవచ్చు.', 'ఈ పత్రంలో నమోదైన సమాచారం:', 'ఇది పత్రంలోని సమాచారాన్ని మాత్రమే వివరించడం — ఇది వైద్య రోగనిర్ధారణ కాదు. ఫలితాలు మరియు తదుపరి చర్యల కోసం మీ వైద్యుడిని సంప్రదించండి.', 'ఈ పత్రంలోని వివరాలను నేను స్పష్టంగా చదవలేకపోయాను. మీరు రికార్డ్‌ను తెరిచి ఒరిజినల్ ఫైల్‌ను చూడవచ్చు లేదా వివరాలను మీరే సవరించవచ్చు.'),
  Marathi: G('एआय (AI) कडून मिळालेली माहिती केवळ सामान्य मार्गदर्शनासाठी आहे. ही डॉक्टरांच्या सल्ल्याची जागा घेत नाही.', 'तुमचा प्रश्न गंभीर समस्येचा संकेत असू शकतो. कृपया लगेच जवळच्या रुग्णालयाच्या इमर्जन्सीत जा.', 'तापात आराम करा आणि भरपूर द्रवपदार्थ (पाणी, ORS) घ्या. कोणती औषधे आणि किती प्रमाण घ्यावी हे तुमच्या वय, लक्षणे, अ‍ॅलर्जी आणि इतर औषधांवर अवलंबून असते — त्यामुळे औषध घेण्यापूर्वी डॉक्टर किंवा फार्मासिस्टला विचारा. ताप 3 दिवसांपेक्षा जास्त राहिल्यास, खूप जास्त असल्यास, किंवा रॅश, मान घट्ट होणे, गोंधळ किंवा श्वास घेण्यास त्रास होत असल्यास डॉक्टरांना भेटा.', 'खोकला-सर्दीत उष्ण द्रवपदार्थ, आराम आणि वाफ घेतल्यास आराम मिळतो. मध घशाला आराम देते (1 वर्षांपेक्षा लहान मुलांना मध देऊ नका). दम लागणे, छातीत दुखणे, खोकल्यात रक्त यायचे किंवा लक्षणे 2 आठवड्यांपेक्षा जास्त राहिल्यास डॉक्टरांना भेटा.', 'घशात दुखत असताना उष्ण मीठ-पाण्याने गरगरे करा, उष्ण द्रवपदार्थ घ्या आणि आराम करा. गिळणे अतिशय कठीण असल्यास, ताप जास्त असल्यास किंवा घशाच्या एका बाजूला तीव्र वेदना/सूज असल्यास डॉक्टरांना भेटा.', 'पाण्याची कमतरता असताना थोडे थोडे पाणी किंवा ORS प्या आणि थंड ठिकाणी आराम करा. कोरडे तोंड, गडद पिवळे लघवी, चक्कर येणे किंवा लघवी कमी पडणे ही चेतावणी आहे. बाळांना, वृद्धांना, किंवा द्रवपदार्थ जुमानत नसलेल्या व्यक्तीला लवकर डॉक्टरकडे घ्या.', 'सामान्य डोकेदुखीत शांत, कमी उजेडात आराम करा, पाणी प्या आणि स्क्रीनपासून दूर रहा. अचानक अतितीव्र डोकेदुखी, जखमेनंतरची वेदना, तापासोबत मान घट्ट, डोळ्यांसमोर धुळीसारखे, कमजोरी किंवा उलट्या असल्यास तत्काळ डॉक्टरांना भेटा.', 'पोटाच्या सामान्य समस्यांत हलका आहार, पाणी आणि आरामामुळे फायदा होतो. अतिसार/उलट्यांत ORS घेत रहा. रक्तमिश्रित उलट्या/स्टूल, तीव्र वेदना, जास्त ताप किंवा द्रवपदार्थ जुमानत नसल्यास लगेच डॉक्टरांकडे जा.', 'छोट्या जखमेला स्वच्छ वाहत्या पाण्याने धुवा आणि स्वच्छ कापडाने/पट्टीने झाका. खोल जखम, जास्त रक्तस्त्राव, सूज/पू, किंवा प्राण्याचा चावा असल्यास लवकर डॉक्टरांना भेटा.', 'योग्य औषध आणि मात्रा यावर तुमचे वय, वजन, लक्षणे, अ‍ॅलर्जी, विद्यमान आजार, गर्भधारणा आणि इतर औषधे परिणाम करतात — त्यामुळे मी औषधाचे नाव किंवा मात्रा सुचवू शकत नाही. पात्र डॉक्टर किंवा फार्मासिस्टचा सल्ला घ्या. स्वतःहून औषध बदलू नका किंवा थांबवू नका.', 'डॉक्टरांना कधी भेटावे: लक्षणे वाढल्यास किंवा बराच काळ राहिल्यास, तीव्र ताप, श्वासास त्रास, छातीत दुखणे, बेशुद्ध पडणे, सतत उलट्या, लघवीत/स्टूलमध्ये रक्त, किंवा बाळ/गर्भवती स्त्री/वृद्ध व्यक्तीबाबत चिंता असल्यास. संशय असल्यास आधीच तपासणी करणे नेहमी सुरक्षित.', 'मी सामान्य आरोग्य माहिती देऊ शकतो — ताप, खोकला, पाण्याची कमतरता, औषधांची वेळ किंवा अहवाल समजून घेण्याबाबत. निदान किंवा औषध सुचवणे माझ्याकडून होत नाही. वैयक्तिक सल्ल्यासाठी डॉक्टरांना भेटा. तुम्ही टोकन बुक करू शकता किंवा तुमच्या मेडिकल रेकॉर्डबद्दल विचारू शकता.', 'या दस्तऐवजात नोंदवलेली माहिती:', 'ही केवळ दस्तऐवजातील माहितीचे स्पष्टीकरण आहे — हे वैद्यकीय निदान नाही. निकालांबाबत आणि पुढील पावलांसाठी तुमच्या डॉक्टरांचा सल्ला घ्या.', 'या दस्तऐवजातील तपशील मी स्पष्टपणे वाचू शकलो नाही. तुम्ही रेकॉर्ड उघडून मूळ फाइल पाहू शकता किंवा तपशील स्वतः दुरुस्त करू शकता.'),
  Tamil: G('AI வழங்கும் தகவல் பொதுவான வழிகாட்டலுக்கு மட்டுமே. இது மருத்துவர் ஆலோசனைக்கு மாற்றாகாது.', 'உங்கள் கேள்வி தீவிரமான பிரச்சனையைக் குறிக்கலாம். உடனடியாக அருகிலுள்ள மருத்துவமனை அவசர சிகிச்சைப் பிரிவுக்குச் செல்லுங்கள்.', 'காய்ச்சலில் ஓய்வு எடுங்கள், நிறைய தண்ணீர்/திரவங்கள் குடியுங்கள். எந்த மருந்து, எவ்வளவு அளவு என்பது உங்கள் வயது, அறிகுறிகள், ஒவ்வாமை, பிற மருந்துகளைப் பொறுத்தது — எனவே மருந்து எடுப்பதற்கு முன் மருத்துவர் அல்லது மருந்தாளரை அணுகுங்கள். 3 நாட்களுக்கு மேல் காய்ச்சல், மிக அதிகமாக இருந்தால், அல்லது சொறி, கழுத்து விறைப்பு, குழப்பம் அல்லது மூச்சுவிடுவதில் சிக்கல் இருந்தால் மருத்துவரை அணுகுங்கள்.', 'இருமல்-ஜலதோஷத்தில் வெதுவெதுப்பான திரவங்கள், ஓய்வு, நீராவி ஆகியவை ஆறுதல் அளிக்கும். தேன் தொண்டைக்கு ஆறுதலாக இருக்கும் (1 வயதுக்குட்பட்ட குழந்தைகளுக்கு தேன் கொடுக்க வேண்டாம்). மூச்சுத் திணறல், நெஞ்சு வலி, இருமலில் ரத்தம் அல்லது 2 வாரங்களுக்கு மேல் அறிகுறிகள் இருந்தால் மருத்துவரை அணுகுங்கள்.', 'தொண்டை வலிக்கு வெதுவெதுப்பான உப்புத்தண்ணீரால் கொப்பளிக்கவும், சூடான திரவங்கள் குடிக்கவும், ஓய்வு எடுக்கவும். விழுங்குவது மிகவும் கடினம், உயர் காய்ச்சல் அல்லது தொண்டையின் ஒரு பக்கம் கடும் வலி/வீக்கம் இருந்தால் மருத்துவரை அணுகுங்கள்.', 'நீரிழப்பில் கொஞ்சம் கொஞ்சமாக தண்ணீர் அல்லது ORS குடித்து குளிர்ந்த இடத்தில் ஓய்வெடுங்கள். வறண்ட வாய், அடர் மஞ்சள் சிறுநீர், தலைச்சுற்றல், மிகக் குறைவான சிறுநீர் ஆபத்து அறிகுறிகள். குழந்தைகள், பெரியவர்கள், அல்லது திரவம் குடிக்க முடியாதவர்களை விரைவாக மருத்துவரிடம் அழைத்துச் செல்லுங்கள்.', 'சாதாரண தலைவலியில் அமைதியான, குறைந்த வெளிச்சமுள்ள இடத்தில் ஓய்வெடுங்கள், தண்ணீர் குடியுங்கள், திரைகளிலிருந்து விலகி இருங்கள். திடீர் கடும் தலைவலி, காயத்திற்குப் பின் வலி, காய்ச்சலுடன் கழுத்து விறைப்பு, பார்வை மங்கல், பலவீனம் அல்லது வாந்தி இருந்தால் உடனடியாக மருத்துவரை அணுகுங்கள்.', 'வயிற்றுப் பொதுப் பிரச்சனைகளில் லேசான உணவு, தண்ணீர், ஓய்வு ஆறுதல் அளிக்கும். வயிற்றுப்போக்கு/வாந்தியில் ORS தொடர்ந்து எடுங்கள். ரத்தத்துடன் கூடிய வாந்தி/மலம், கடும் வலி, உயர் காய்ச்சல் அல்லது திரவம் எடுத்துக்கொள்ள முடியாத நிலை இருந்தால் உடனடியாக மருத்துவரை அணுகுங்கள்.', 'சிறு காயத்தை சுத்தமான ஓடும் நீரில் கழுவி சுத்தமான துணியால் மூடுங்கள். ஆழமான காயம், அதிக இரத்தப்போக்கு, வீக்கம்/சீழ், அல்லது விலங்கு கடிவாய் இருந்தால் விரைவில் மருத்துவரை அணுகுங்கள்.', 'சரியான மருந்து மற்றும் அளவு உங்கள் வயது, எடை, அறிகுறிகள், ஒவ்வாமை, இருக்கும் நோய்கள், கர்ப்பம் மற்றும் பிற மருந்துகளைப் பொறுத்தது — எனவே நான் மருந்தின் பெயர் அல்லது அளவைப் பரிந்துரைக்க முடியாது. தகுதியான மருத்துவர் அல்லது மருந்தாளரை அணுகுங்கள். நீங்களே மருந்தை மாற்றவோ நிறுத்தவோ செய்யாதீர்கள்.', 'மருத்துவரை எப்போது அணுக வேண்டும்: அறிகுறிகள் அதிகரித்தால் அல்லது நீளமாக இருந்தால், உயர் காய்ச்சல், மூச்சுக்கு சிரமம், நெஞ்சு வலி, மயக்கம், தொடர் வாந்தி, சிறுநீர்/மலத்தில் ரத்தம், அல்லது குழந்தை/கர்ப்பிணி/பெரியவர்களின் உடல்நிலை குறித்து கவலை இருந்தால். சந்தேகம் இருந்தால் முன்பே பரிசோதனை செய்வது நல்லது.', 'நான் பொதுவான சுகாதாரத் தகவல் தர முடியும் — காய்ச்சல், இருமல், நீரிழப்பு, மருந்து நேரம், ரிப்போர்ட் புரிந்துகொள்ளுதல் பற்றி. நோய் கண்டறிதல் அல்லது மருந்து பரிந்துரைக்க நான் முடியாது. தனிப்பட்ட ஆலோசனைக்கு மருத்துவரை அணுகுங்கள். டோக்கன் பதிவு செய்யலாம் அல்லது உங்கள் மருத்துவ பதிவுகளைப் பற்றி கேட்கலாம்.', 'இந்த ஆவணத்தில் பதிவான தகவல்:', 'இது ஆவணத்தில் உள்ள தகவலை மட்டும் விளக்குவதே — இது மருத்துவ நோய் கண்டறிதல் அல்ல. முடிவுகள் மற்றும் அடுத்த படிகளுக்கு உங்கள் மருத்துவரை அணுகுங்கள்.', 'இந்த ஆவணத்தின் விவரங்களை தெளிவாகப் படிக்க முடியவில்லை. பதிவைத் திறந்து அசல் கோப்பைப் பார்க்கலாம் அல்லது விவரங்களை நீங்களே திருத்தலாம்.'),
  Gujarati: G('AI પાસેથી મળેલી માહિતી માત્ર સામાન્ય માર્ગદર્શન માટે છે. તે ડૉક્ટરની સલાહનો વિકલ્પ નથી.', 'તમારો પ્રશ્ન ગંભીર સમસ્યા સૂચવી શકે છે. કૃપા કરીને તરત નજીકની હોસ્પિટલની ઇમરજન્સીમાં જાઓ.', 'તાવમાં આરામ કરો અને પુષ્કળ પ્રવાહી (પાણી, ORS) લો. કઈ દવા અને કેટલી માત્રા લેવી તે તમારી ઉંમર, લક્ષણો, એલર્જી અને અન્ય દવાઓ પર આધાર રાખે છે — તેથી દવા લેતા પહેલાં ડૉક્ટર કે ફાર્માસિસ્ટની સલાહ લો. તાવ 3 દિવસથી વધુ રહે, ખૂબ વધારે હોય, અથવા રેશ, ગરદન ઘટ્ટ થવી, ગૂંચવણ કે શ્વાસમાં તકલીફ હોય તો ડૉક્ટરને મળો.', 'ખાંસી-શરદીમાં ગરમ પ્રવાહી, આરામ અને વરાળ આરામ આપે છે. મધ ગળાને હળવાશ આપે છે (1 વર્ષથી નાના બાળકોને મધ ન આપો). શ્વાસ લેવામાં તકલીફ, છાતીમાં દુખાવો, ખાંસીમાં લોહી કે લક્ષણો 2 અઠવાડિયાથી વધુ રહે તો ડૉક્ટરને મળો.', 'ગળાના દુખાવામાં હૂંફાળા મીઠા-પાણીથી ગાર્ગલ કરો, ગરમ પ્રવાહી લો અને આરામ કરો. ગળવું ખૂબ મુશ્કેલ, તાવ વધારે, કે ગળાની એક બાજુ તીવ્ર દુખાવો/સોજો હોય તો ડૉક્ટરને મળો.', 'પાણીની ઉણપમાં થોડું થોડું પાણી કે ORS પિવો અને ઠંડી જગ્યાએ આરામ કરો. સૂકું મોં, ઘાટું પીળું મૂત્ર, ચક્કર, કે ખૂબ ઓછું મૂત્ર ચેતવણી છે. બાળકો, વૃદ્ધો, કે પ્રવાહી રાખી ન શકનારા લોકોને ઝટથી ડૉક્ટર પાસે લઈ જાઓ.', 'સામાન્ય માથાના દુખાવામાં શાંત, ઓછા પ્રકાશવાળી જગ્યાએ આરામ કરો, પાણી પિવો અને સ્ક્રીનથી દૂર રહો. અચાનક અતિ તીવ્ર દુખાવો, ઈજા પછીનો દુખાવો, તાવ સાથે ગરદન ઘટ્ટ, ધુંધળું દેખાવું, નબળાઈ કે ઊલટી હોય તો તરત ડૉક્ટરને મળો.', 'પેટની સામાન્ય તકલીફમાં હલકો ખોરાક, પાણી અને આરામ ફાયદાકારક છે. ઝાડા/ઊલટીમાં ORS લેતા રહો. લોહીવાળી ઊલટી/મળ, તીવ્ર દુખાવો, વધારે તાવ કે પ્રવાહી રાખી ન શકો તો તરત ડૉક્ટર પાસે જાઓ.', 'નાના ઘાને સ્વચ્છ વહેતા પાણીથી ધોઈ સ્વચ્છ કાપડથી ઢાંકો. ઊંડો ઘા, વધુ રક્તસ્રાવ, સોજો/ચાંદી, કે પ્રાણીનો ડંખ હોય તો ઝટથી ડૉક્ટરને મળો.', 'સાચી દવા અને માત્રા તમારી ઉંમર, વજન, લક્ષણો, એલર્જી, હાલના રોગો, ગર્ભાવસ્થા અને અન્ય દવાઓ પર આધારે છે — તેથી હું દવાનું નામ કે માત્રા સૂચવી શકતો નથી. લાયક ડૉક્ટર કે ફાર્માસિસ્ટની સલાહ લો. જાતે દવા બદલો કે બંધ ન કરો.', 'ડૉક્ટરને ક્યારે મળવું: લક્ષણો વધે કે લાંબા સમય સુધી રહે, તીવ્ર તાવ, શ્વાસમાં તકલીફ, છાતીમાં દુખાવો, બેભાની, વારંવાર ઊલટી, મૂત્ર/મળમાં લોહી, કે બાળક/ગર્ભવતી/વૃદ્ધ વ્યક્તિ વિશે ચિંતા હોય તો. શંકા હોય તો પહેલેથી તપાસ કરાવવી સલામત.', 'હું સામાન્ય આરોગ્ય માહિતી આપી શકું છું — તાવ, ખાંસી, પાણીની ઉણપ, દવાની સમય કે રિપોર્ટ સમજવા વિશે. રોગનું નિદાન કે દવા સૂચવી શકતો નથી. વ્યક્તિગત સલાહ માટે ડૉક્ટરને મળો. તમે ટોકન બુક કરી શકો છો કે તમારા મેડિકલ રેકોર્ડ વિશે પૂછી શકો છો.', 'આ દસ્તાવેજમાં નોંધાયેલી માહિતી:', 'આ ફક્ત દસ્તાવેજની માહિતીનું સમજૂતી છે — તે વૈદ્યકીય નિદાન નથી. પરિણામો અને આગળનાં પગલાં માટે તમારા ડૉક્ટરની સલાહ લો.', 'આ દસ્તાવેજની વિગતો મેં સ્પષ્ટપણે વાંચી શકી નથી. તમે રેકોર્ડ ખોલીને મૂળ ફાઇલ જોઈ શકો છો અથવા વિગતો જાતે સુધારી શકો છો.'),
  Kannada: G('AI ನೀಡುವ ಮಾಹಿತಿ ಸಾಮಾನ್ಯ ಮಾರ್ಗದರ್ಶನಕ್ಕೆ ಮಾತ್ರ. ಇದು ವೈದ್ಯರ ಸಲಹೆಗೆ ಬದಲಾಗಿಲ್ಲ.', 'ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಗಂಭೀರ ಸಮಸ್ಯೆಯನ್ನು ಸೂಚಿಸಬಹುದು. ದಯವಿಟ್ಟು ತಕ್ಷಣ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಯ ತುರ್ತು ವಿಭಾಗಕ್ಕೆ ಹೋಗಿ.', 'ಜ್ವರದಲ್ಲಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ ಮತ್ತು ಸಾಕಷ್ಟು ದ್ರವ (ನೀರು, ORS) ತೆಗೆದುಕೊಳ್ಳಿ. ಯಾವ ಔಷಧ, ಎಷ್ಟು ಪ್ರಮಾಣ ಎಂಬುದು ನಿಮ್ಮ ವಯಸ್ಸು, ಲಕ್ಷಣಗಳು, ಅಲರ್ಜಿ ಮತ್ತು ಇತರ ಔಷಧಗಳನ್ನು ಅವಲಂಬಿಸಿದೆ — ಆದ್ದರಿಂದ ಔಷಧ ತೆಗೆದುಕೊಳ್ಳುವ ಮೊದಲು ವೈದ್ಯರು ಅಥವಾ ಔಷಧಿಗಾರರನ್ನು ಕೇಳಿ. ಜ್ವರ 3 ದಿನಗಳಿಗಿಂತ ಹೆಚ್ಚು ಇದ್ದರೆ, ಬಹಳ ಹೆಚ್ಚಿದ್ದರೆ, ಅಥವಾ ದದ್ದು, ಕುತ್ತಿಗೆ ಬಿಗಿಯಾಗುವಿಕೆ, ಗೊಂದಲ ಅಥವಾ ಉಸಿರಾಟದ ತೊಂದರೆ ಇದ್ದರೆ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.', 'ಕೆಮ್ಮು-ಶೀತದಲ್ಲಿ ಬಿಸಿ ದ್ರವ, ವಿಶ್ರಾಂತಿ ಮತ್ತು ಆವಿ ಉಪಶಮನ ನೀಡುತ್ತದೆ. ಜೇನುತುಪ್ಪ ಗಂಟಲಿಗೆ ಆರಾಮ ನೀಡುತ್ತದೆ (1 ವರ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ ಮಕ್ಕಳಿಗೆ ಜೇನು ನೀಡಬೇಡಿ). ಉಸಿರಾಟದ ತೊಂದರೆ, ಎದೆ ನೋವು, ಕೆಮ್ಮಲ್ಲಿ ರಕ್ತ ಅಥವಾ ಲಕ್ಷಣಗಳು 2 ವಾರಗಳಿಗಿಂತ ಹೆಚ್ಚು ಇದ್ದರೆ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.', 'ಗಂಟಲು ನೋವಿನಲ್ಲಿ ಬಿಸಿ ಉಪ್ಪು-ನೀರಿನಿಂದ ಗುಳ್ಳೆ ಮಾಡಿ, ಬಿಸಿ ದ್ರವ ತೆಗೆದುಕೊಳ್ಳಿ ಮತ್ತು ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ. ನುಂಗುವುದು ಬಹಳ ಕಷ್ಟ, ಹೆಚ್ಚಿನ ಜ್ವರ ಅಥವಾ ಗಂಟಲಿನ ಒಂದು ಬದಿಯಲ್ಲಿ ತೀವ್ರ ನೋವು/ಊತ ಇದ್ದರೆ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.', 'ನಿರ್ಜಲೀಕರಣದಲ್ಲಿ ಸ್ವಲ್ಪ ಸ್ವಲ್ಪ ನೀರು ಅಥವಾ ORS ಕುಡಿಯಿರಿ ಮತ್ತು ತಂಪಾದ ಸ್ಥಳದಲ್ಲಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ. ಒಣ ಬಾಯಿ, ಗಾಢ ಹಳದಿ ಮೂತ್ರ, ತಲೆತಿರುಗುವಿಕೆ ಅಥವಾ ಬಹಳ ಕಡಿಮೆ ಮೂತ್ರ ಎಚ್ಚರಿಕೆ ಸಂಕೇತಗಳು. ಮಕ್ಕಳು, ವೃದ್ಧರು, ಅಥವಾ ದ್ರವ ತೆಗೆದುಕೊಳ್ಳಲಾಗದವರನ್ನು ತಕ್ಷಣ ವೈದ್ಯರ ಬಳಿ ಕರೆದೊಯ್ಯಿರಿ.', 'ಸಾಮಾನ್ಯ ತಲೆನೋವಿನಲ್ಲಿ ಶಾಂತ, ಕಡಿಮೆ ಬೆಳಕಿನ ಸ್ಥಳದಲ್ಲಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ, ನೀರು ಕುಡಿಯಿರಿ, ಪರದೆಗಳಿಂದ ದೂರವಿರಿ. ಹಠಾತ್ ಅತಿ ತೀವ್ರ ನೋವು, ಗಾಯದ ನಂತರದ ನೋವು, ಜ್ವರದೊಂದಿಗೆ ಕುತ್ತಿಗೆ ಬಿಗಿ, ದೃಷ್ಟಿ ಮಸುಕು, ದೌರ್ಬಲ್ಯ ಅಥವಾ ವಾಂತಿ ಇದ್ದರೆ ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.', 'ಹೊಟ್ಟೆಯ ಸಾಮಾನ್ಯ ಸಮಸ್ಯೆಗಳಲ್ಲಿ ಸೌಮ್ಯ ಆಹಾರ, ನೀರು ಮತ್ತು ವಿಶ್ರಾಂತಿ ಆರಾಮ ನೀಡುತ್ತದೆ. ಭೇದಿ/ವಾಂತಿಯಲ್ಲಿ ORS ತೆಗೆದುಕೊಳ್ಳುತ್ತಾ ಇರಿ. ರಕ್ತಸಹಿತ ವಾಂತಿ/ಮಲ, ತೀವ್ರ ನೋವು, ಹೆಚ್ಚಿನ ಜ್ವರ ಅಥವಾ ದ್ರವ ಇರಿಸಿಕೊಳ್ಳಲಾಗದಿದ್ದರೆ ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.', 'ಸಣ್ಣ ಗಾಯವನ್ನು ಸ್ವಚ್ಛ ಹರಿಯುವ ನೀರಿನಿಂದ ತೊಳೆದು ಸ್ವಚ್ಛ ಬಟ್ಟೆಯಿಂದ ಮುಚ್ಚಿ. ಆಳವಾದ ಗಾಯ, ಹೆಚ್ಚು ರಕ್ತಸ್ರಾವ, ಊತ/ಕೀವು, ಅಥವಾ ಪ್ರಾಣಿ ಕಡಿತ ಇದ್ದರೆ ಶೀಘ್ರ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.', 'ಸರಿಯಾದ ಔಷಧ ಮತ್ತು ಪ್ರಮಾಣ ನಿಮ್ಮ ವಯಸ್ಸು, ತೂಕ, ಲಕ್ಷಣಗಳು, ಅಲರ್ಜಿ, ಇರುವ ರೋಗಗಳು, ಗರ್ಭಧಾರಣೆ ಮತ್ತು ಇತರ ಔಷಧಗಳನ್ನು ಅವಲಂಬಿಸಿದೆ — ಆದ್ದರಿಂದ ನಾನು ಔಷಧದ ಹೆಸರು ಅಥವಾ ಪ್ರಮಾಣವನ್ನು ಶಿಫಾರಸು ಮಾಡಲಾಗುವುದಿಲ್ಲ. ಅರ್ಹ ವೈದ್ಯರು ಅಥವಾ ಔಷಧಿಗಾರರನ್ನು ಸಂಪರ್ಕಿಸಿ. ನೀವೇ ಔಷಧ ಬದಲಾಯಿಸಬೇಡಿ ಅಥವಾ ನಿಲ್ಲಿಸಬೇಡಿ.', 'ವೈದ್ಯರನ್ನು ಯಾವಾಗ ಭೇಟಿ ಮಾಡಬೇಕು: ಲಕ್ಷಣಗಳು ಹೆಚ್ಚಾದರೆ ಅಥವಾ ದೀರ್ಘ ಇದ್ದರೆ, ತೀವ್ರ ಜ್ವರ, ಉಸಿರಾಟದ ತೊಂದರೆ, ಎದೆ ನೋವು, ಮೂರ್ಛೆ, ಪುನರಾವರ್ತಿತ ವಾಂತಿ, ಮೂತ್ರ/ಮಲದಲ್ಲಿ ರಕ್ತ, ಅಥವಾ ಮಗು/ಗರ್ಭಿಣಿ/ವೃದ್ಧರ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಕಾಳಜಿ ಇದ್ದರೆ. ಅನುಮಾನವಿದ್ದರೆ ಮೊದಲೇ ಪರೀಕ್ಷೆ ಮಾಡಿಸುವುದು ಸುರಕ್ಷಿತ.', 'ನಾನು ಸಾಮಾನ್ಯ ಆರೋಗ್ಯ ಮಾಹಿತಿ ನೀಡಬಲ್ಲೆ — ಜ್ವರ, ಕೆಮ್ಮು, ನಿರ್ಜಲೀಕರಣ, ಔಷಧದ ಸಮಯ, ವರದಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವಿಕೆ ಬಗ್ಗೆ. ರೋಗನಿರ್ಣಯ ಅಥವಾ ಔಷಧ ಶಿಫಾರಸು ಮಾಡಲು ನನಗೆ ಸಾಧ್ಯವಿಲ್ಲ. ವೈಯಕ್ತಿಕ ಸಲಹೆಗೆ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ. ನೀವು ಟೋಕನ್ ಬುಕ್ ಮಾಡಬಹುದು ಅಥವಾ ನಿಮ್ಮ ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳ ಬಗ್ಗೆ ಕೇಳಬಹುದು.', 'ಈ ದಸ್ತಾವೇಜಿನಲ್ಲಿ ದಾಖಲಾದ ಮಾಹಿತಿ:', 'ಇದು ದಸ್ತಾವೇಜಿನಲ್ಲಿನ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ವಿವರಿಸುವುದು — ಇದು ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯವಲ್ಲ. ಫಲಿತಾಂಶಗಳು ಮತ್ತು ಮುಂದಿನ ಹಂತಗಳಿಗೆ ನಿಮ್ಮ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.', 'ಈ ದಸ್ತಾವೇಜಿನ ವಿವರಗಳನ್ನು ನಾನು ಸ್ಪಷ್ಟವಾಗಿ ಓದಲಾಗಲಿಲ್ಲ. ನೀವು ದಾಖಲೆಯನ್ನು ತೆರೆದು ಮೂಲ ಫೈಲ್ ವೀಕ್ಷಿಸಬಹುದು ಅಥವಾ ವಿವರಗಳನ್ನು ನೀವೇ ಸರಿಪಡಿಸಬಹುದು.'),
  Malayalam: G('AI നൽകുന്ന വിവരം പൊതുവായ നിർദ്ദേശത്തിന് മാത്രം. ഇത് ഡോക്ടറുടെ ഉപദേശത്തിന് പകരമല്ല.', 'നിങ്ങളുടെ ചോദ്യം ഗുരുതരമായ പ്രശ്നം സൂചിപ്പിക്കാം. ദയവായി ഉടനെ അടുത്ത ആശുപത്രിയുടെ എമർജൻസിയിൽ എത്തുക.', 'പനിയിൽ വിശ്രമിക്കുക, ധാരാളം വെള്ളം/ദ്രവങ്ങൾ കുടിക്കുക. ഏത് മരുന്ന്, എത്ര അളവ് എന്നത് നിങ്ങളുടെ പ്രായം, ലക്ഷണങ്ങൾ, അലർജി, മറ്റ് മരുന്നുകൾ എന്നിവയെ ആശ്രയിക്കുന്നു — അതിനാൽ മരുന്ന് കഴിക്കും മുൻപ് ഡോക്ടറെയോ ഫാർമസിസ്റ്റിനെയോ ചോദിക്കുക. പനി 3 ദിവസത്തിൽ കൂടുതൽ ഉണ്ടെങ്കിൽ, വളരെ കൂടുതലാണെങ്കിൽ, അല്ലെങ്കിൽ ചൊറി, കഴുത്ത് വലിവ്, ആശയക്കുഴപ്പം അല്ലെങ്കിൽ ശ്വാസതടസ്സം ഉണ്ടെങ്കിൽ ഡോക്ടറെ കാണുക.', 'ചുമ-ജലദോഷത്തിൽ ചൂടുവെള്ളം, വിശ്രമം, നീരാവി എന്നിവ ആശ്വാസം നൽകും. തേൻ തൊണ്ടയ്ക്ക് ആശ്വാസമാണ് (1 വയസ്സിൽ താഴെയുള്ള കുഞ്ഞുങ്ങൾക്ക് തേൻ നൽകരുത്). ശ്വാസതടസ്സം, നെഞ്ചുവേദന, ചുമയിൽ രക്തം അല്ലെങ്കിൽ ലക്ഷണങ്ങൾ 2 ആഴ്ചയിൽ കൂടുതൽ ഉണ്ടെങ്കിൽ ഡോക്ടറെ കാണുക.', 'തൊണ്ടവേദനയിൽ ചൂടുള്ള ഉപ്പുവെള്ളത്തിൽ ഗാർഗിൾ ചെയ്യുക, ചൂടുദ്രവം കുടിക്കുക, വിശ്രമിക്കുക. വിഴുങ്ങുന്നത് വളരെ ബുദ്ധിമുട്ട്, ഉയർന്ന പനി അല്ലെങ്കിൽ തൊണ്ടയുടെ ഒരു വശത്ത് കടുത്ത വേദന/വീക്കം ഉണ്ടെങ്കിൽ ഡോക്ടറെ കാണുക.', 'നിർജലീകരണത്തിൽ കുറച്ചുകൂടി വെള്ളം അല്ലെങ്കിൽ ORS കുടിച്ച് തണുത്ത സ്ഥലത്ത് വിശ്രമിക്കുക. വറ്റിയ വായ, കടും മഞ്ഞ മൂത്രം, തലകറക്കം അല്ലെങ്കിൽ വളരെ കുറഞ്ഞ മൂത്രം എന്നിവ അപകട ലക്ഷണങ്ങളാണ്. കുഞ്ഞുങ്ങൾ, പ്രായമായവർ, അല്ലെങ്കിൽ ദ്രവം കുടിക്കാൻ കഴിയാത്തവരെ ഉടനെ ഡോക്ടറുടെ അടുത്ത് എത്തിക്കുക.', 'സാധാരണ തലവേദനയിൽ ശാന്തമായ, കുറഞ്ഞ വെളിച്ചമുള്ള സ്ഥലത്ത് വിശ്രമിക്കുക, വെള്ളം കുടിക്കുക, സ്ക്രീനുകളിൽ നിന്ന് അകലുക. പെട്ടെന്നുള്ള കടുത്ത വേദന, മുറിവിനുശേഷമുള്ള വേദന, പനിയോടൊപ്പം കഴുത്ത് വലിവ്, കാഴ്ച മങ്ങൽ, ബലക്ഷയം അല്ലെങ്കിൽ ഛർദ്ദി ഉണ്ടെങ്കിൽ ഉടനെ ഡോക്ടറെ കാണുക.', 'വയറിലെ പൊതു പ്രശ്നങ്ങളിൽ ലഘുവായ ഭക്ഷണം, വെള്ളം, വിശ്രമം ആശ്വാസം നൽകും. അതിസാരം/ഛർദ്ദിയിൽ ORS തുടർന്നും എടുക്കുക. രക്തത്തോടെയുള്ള ഛർദ്ദി/മലം, കടുത്ത വേദന, ഉയർന്ന പനി അല്ലെങ്കിൽ ദ്രവം ഉൾക്കൊള്ളാൻ കഴിയാത്ത അവസ്ഥ ഉണ്ടെങ്കിൽ ഉടനെ ഡോക്ടറെ കാണുക.', 'ചെറിയ മുറിവ് വൃത്തിയായ ഒഴുകുന്ന വെള്ളത്തിൽ കഴുകി വൃത്തിയായ തുണി കൊണ്ട് മൂടുക. ആഴമുള്ള മുറിവ്, അധിക രക്തസ്രാവം, വീക്കം/പഴുപ്പ്, അല്ലെങ്കിൽ മൃഗം കടി ഉണ്ടെങ്കിൽ പെട്ടെന്ന് ഡോക്ടറെ കാണുക.', 'ശരിയായ മരുന്നും അളവും നിങ്ങളുടെ പ്രായം, ഭാരം, ലക്ഷണങ്ങൾ, അലർജി, നിലവിലുള്ള രോഗങ്ങൾ, ഗർഭധാരണം, മറ്റ് മരുന്നുകൾ എന്നിവയെ ആശ്രയിക്കുന്നു — അതിനാൽ ഞാൻ മരുന്നിന്റെ പേരോ അളവോ ശുപാർശ ചെയ്യുന്നില്ല. യോഗ്യതയുള്ള ഡോക്ടറെയോ ഫാർമസിസ്റ്റിനെയോ സമീപിക്കുക. സ്വയം മരുന്ന് മാറ്റരുത് അല്ലെങ്കിൽ നിർത്തരുത്.', 'ഡോക്ടറെ എപ്പോൾ കാണണം: ലക്ഷണങ്ങൾ വർദ്ധിക്കുകയോ ദീർഘകാലം തുടരുകയോ ചെയ്താൽ, ഉയർന്ന പനി, ശ്വാസക്കുഴപ്പം, നെഞ്ചുവേദന, അബോധാവസ്ഥ, ആവർത്തിച്ചുള്ള ഛർദ്ദി, മൂത്രത്തിലോ മലത്തിലോ രക്തം, അല്ലെങ്കിൽ കുഞ്ഞ്/ഗർഭിണി/പ്രായമായവരുടെ ആരോഗ്യം സംബന്ധിച്ച് ആശങ്ക ഉണ്ടെങ്കിൽ. സംശയമുണ്ടെങ്കിൽ നേരത്തെ പരിശോധിക്കുന്നതാണ് സുരക്ഷിതം.', 'എനിക്ക് പൊതുവായ ആരോഗ്യ വിവരങ്ങൾ നൽകാൻ കഴിയും — പനി, ചുമ, നിർജലീകരണം, മരുന്നിന്റെ സമയം, റിപ്പോർട്ട് മനസ്സിലാക്കൽ എന്നിവയെക്കുറിച്ച്. രോഗനിർണയം അല്ലെങ്കിൽ മരുന്ന് ശുപാർശ ചെയ്യാൻ എനിക്ക് കഴിയില്ല. വ്യക്തിഗത ഉപദേശത്തിന് ഡോക്ടറെ കാണുക. ടോക്കൺ ബുക്ക് ചെയ്യാം അല്ലെങ്കിൽ നിങ്ങളുടെ മെഡിക്കൽ റെക്കോർഡുകളെക്കുറിച്ച് ചോദിക്കാം.', 'ഈ രേഖയിൽ രേഖപ്പെടുത്തിയ വിവരങ്ങൾ:', 'ഇത് രേഖയിലെ വിവരങ്ങൾ മാത്രം വിശദീകരിക്കുന്നു — ഇത് വൈദ്യശാസ്ത്രപരമായ രോഗനിർണയമല്ല. ഫലങ്ങളെക്കുറിച്ചും അടുത്ത നടപടികളെക്കുറിച്ചും നിങ്ങളുടെ ഡോക്ടറെ സമീപിക്കുക.', 'ഈ രേഖയിലെ വിവരങ്ങൾ വ്യക്തമായി വായിക്കാൻ എനിക്ക് കഴിഞ്ഞില്ല. നിങ്ങൾക്ക് റെക്കോർഡ് തുറന്ന് യഥാർത്ഥ ഫയൽ കാണാം അല്ലെങ്കിൽ വിവരങ്ങൾ സ്വയം തിരുത്താം.'),
  Odia: G('AI ଦ୍ୱାରା ଦିଆଯାଇଥିବା ସୂଚନା କେବଳ ସାଧାରଣ ମାର୍ଗଦର୍ଶନ ପାଇଁ। ଏହା ଡାକ୍ତରଙ୍କ ପରାମର୍ଶର ବିକଳ୍ପ ନୁହେଁ।', 'ଆପଣଙ୍କ ପ୍ରଶ୍ନ ଏକ ଗମ୍ଭୀର ସମସ୍ୟାର ସଙ୍କେତ ହୋଇପାରେ। ଦୟାକରି ଏବେ ହିଁ ନିକଟତମ ଡାକ୍ତରଖାନାର ଏମରଜେନ୍ସିକୁ ଯାଆନ୍ତୁ।', 'ଜ୍ୱରରେ ବିଶ୍ରାମ ନିଅନ୍ତୁ ଏବଂ ପ୍ରଚୁର ତରଳ (ପାଣି, ORS) ପିଅନ୍ତୁ। କେଉଁ ଔଷଧ ଓ କେତେ ମାତ୍ରା ନେବେ ତାହା ଆପଣଙ୍କ ବୟସ, ଲକ୍ଷଣ, ଆଲର୍ଜି ଓ ଅନ୍ୟ ଔଷଧ ଉପରେ ନିର୍ଭର କରେ — ତେଣୁ ଔଷଧ ନେବା ପୂର୍ବରୁ ଡାକ୍ତର ବା ଫାର୍ମାସିସ୍ଟଙ୍କୁ ପଚାରନ୍ତୁ। ଜ୍ୱର 3 ଦିନରୁ ଅଧିକ ରହିଲେ, ଅତ୍ୟଧିକ ହେଲେ, କିମ୍ବା ରାସ୍, ବେକ ଜଡ଼ିବା, ଦ୍ୱିଧା କିମ୍ବା ନିଶ୍ୱାସ ନେବାରେ ଅସୁବିଧା ହେଲେ ଡାକ୍ତରଙ୍କୁ ଦେଖାନ୍ତୁ।', 'କାଶ-ଥଣ୍ଡାରେ ଉଷୁମ ତରଳ, ବିଶ୍ରାମ ଓ ବାଷ୍ପ ନେବା ଆରାମ ଦିଏ। ମହୁ ଗଳାକୁ ଆରାମ ଦିଏ (1 ବର୍ଷ ନୂଆ ପିଲାଙ୍କୁ ମହୁ ଦିଅନ୍ତୁ ନାହିଁ)। ନିଶ୍ୱାସ ଅଟକିବା, ଛାତି ଯନ୍ତ୍ରଣା, କାଶରେ ରକ୍ତ କିମ୍ବା ଲକ୍ଷଣ 2 ସପ୍ତାହରୁ ଅଧିକ ହେଲେ ଡାକ୍ତରଙ୍କୁ ଦେଖାନ୍ତୁ।', 'ଗଳା ଯନ୍ତ୍ରଣାରେ ଉଷୁମ ଲୁଣ-ପାଣିରେ ଗାରଗଲ କରନ୍ତୁ, ଉଷୁମ ତରଳ ପିଅନ୍ତୁ ଓ ବିଶ୍ରାମ ନିଅନ୍ତୁ। ଗିଳିବା ବହୁତ କଷ୍ଟକର, ଜ୍ୱର ଅଧିକ କିମ୍ବା ଗଳାର ଗୋଟିଏ ପାଖରେ ପ୍ରବଳ ଯନ୍ତ୍ରଣା/ଫୁଲା ହେଲେ ଡାକ୍ତରଙ୍କୁ ଦେଖାନ୍ତୁ।', 'ପାଣି ଅଭାବରେ ଅଳ୍ପ ଅଳ୍ପ ପାଣି ବା ORS ପିଅନ୍ତୁ ଓ ଥଣ୍ଡା ସ୍ଥାନରେ ବିଶ୍ରାମ ନିଅନ୍ତୁ। ଶୁଖିଲା ପାଟି, ଗାଢ଼ ହଳଦିଆ ମୁତ୍ର, ମୁଣ୍ଡ ବୁଲା କିମ୍ବା ବହୁତ କମ୍ ମୁତ୍ର ଚେତାବନୀ ସଙ୍କେତ। ଶିଶୁ, ବୃଦ୍ଧ, କିମ୍ବା ତରଳ ରଖିପାରୁ ନଥିବା ବ୍ୟକ୍ତିଙ୍କୁ ଶୀଘ୍ର ଡାକ୍ତର ପାଖକୁ ନିଅନ୍ତୁ।', 'ସାଧାରଣ ମୁଣ୍ଡବିନ୍ଧାରେ ଶାନ୍ତ, କମ୍ ଆଲୋକ ସ୍ଥାନରେ ବିଶ୍ରାମ ନିଅନ୍ତୁ, ପାଣି ପିଅନ୍ତୁ ଓ ସ୍କ୍ରିନଠାରୁ ଦୂରରେ ରୁହନ୍ତୁ। ହଠାତ୍ ପ୍ରବଳ ମୁଣ୍ଡବିନ୍ଧା, ମୁଣ୍ଡ ଆଘାତ ପରେ ବିନ୍ଧା, ଜ୍ୱର ସହ ବେକ ଜଡ଼ିବା, ଝାପସା ଦୃଷ୍ଟି, ଦୁର୍ବଳତା କିମ୍ବା ବାନ୍ତି ହେଲେ ଏବେ ହିଁ ଡାକ୍ତରଙ୍କୁ ଦେଖାନ୍ତୁ।', 'ପେଟର ସାଧାରଣ ସମସ୍ୟାରେ ହାଲୁକା ଖାଦ୍ୟ, ପାଣି ଓ ବିଶ୍ରାମ ଆରାମ ଦିଏ। ଝାଡ଼ା/ବାନ୍ତିରେ ORS ନେବା ଜାରି ରଖନ୍ତୁ। ରକ୍ତମିଶ୍ରିତ ବାନ୍ତି/ମଳ, ପ୍ରବଳ ଯନ୍ତ୍ରଣା, ଅଧିକ ଜ୍ୱର କିମ୍ବା ତରଳ ରଖିପାରୁ ନହେଲେ ଏବେ ହିଁ ଡାକ୍ତର ପାଖକୁ ଯାଆନ୍ତୁ।', 'ଛୋଟ କ୍ଷତକୁ ସଫା ବହନ୍ତା ପାଣିରେ ଧୋଇ ସଫା କପଡ଼ା/ବ୍ୟାଣ୍ଡେଜ୍ ଦ୍ୱାରା ଢାଆନ୍ତୁ। ଗଭୀର କ୍ଷତ, ଅଧିକ ରକ୍ତସ୍ରାବ, ଫୁଲା/ପୂ, କିମ୍ବା ପଶୁ କାମୁଡ଼ା ହେଲେ ଶୀଘ୍ର ଡାକ୍ତରଙ୍କୁ ଦେଖାନ୍ତୁ।', 'ସଠିକ୍ ଔଷଧ ଓ ମାତ୍ରା ଆପଣଙ୍କ ବୟସ, ଓଜନ, ଲକ୍ଷଣ, ଆଲର୍ଜି, ବର୍ତ୍ତମାନର ରୋଗ, ଗର୍ଭଧାରଣ ଓ ଅନ୍ୟ ଔଷଧ ଉପରେ ନିର୍ଭର କରେ — ତେଣୁ ମୁଁ ଔଷଧର ନାମ ବା ମାତ୍ରା ପରାମର୍ଶ ଦେଇପାରିବି ନାହିଁ। ଯୋଗ୍ୟ ଡାକ୍ତର ବା ଫାର୍ମାସିସ୍ଟଙ୍କ ପରାମର୍ଶ ନିଅନ୍ତୁ। ନିଜେ ଔଷଧ ବଦଳାନ୍ତୁ ନାହିଁ କିମ୍ବା ବନ୍ଦ କରନ୍ତୁ ନାହିଁ।', 'ଡାକ୍ତରଙ୍କୁ କେବେ ଦେଖାଇବେ: ଲକ୍ଷଣ ବଢ଼ିଲେ ବା ଦୀର୍ଘ ରହିଲେ, ପ୍ରବଳ ଜ୍ୱର, ନିଶ୍ୱାସରେ ଅସୁବିଧା, ଛାତି ଯନ୍ତ୍ରଣା, ଅଚେତନା, ବାରମ୍ବାର ବାନ୍ତି, ମୁତ୍ର/ମଳରେ ରକ୍ତ, କିମ୍ବା ଶିଶୁ/ଗର୍ଭବତୀ/ବୃଦ୍ଧଙ୍କ ପ୍ରତି ଚିନ୍ତା ହେଲେ। ସନ୍ଦେହ ହେଲେ ଆଗରୁ ପରୀକ୍ଷା କରାଇବା ନିରାପଦ।', 'ମୁଁ ସାଧାରଣ ସ୍ୱାସ୍ଥ୍ୟ ସୂଚନା ଦେଇପାରିବି — ଯଥା ଜ୍ୱର, କାଶ, ପାଣି ଅଭାବ, ଔଷଧର ସମୟ ବା ରିପୋର୍ଟ ବୁଝିବା ବିଷୟରେ। ରୋଗ ନିର୍ଣ୍ଣୟ ବା ଔଷଧ ପରାମର୍ଶ ମୁଁ ଦେଇପାରିବି ନାହିଁ। ବ୍ୟକ୍ତିଗତ ପରାମର୍ଶ ପାଇଁ ଡାକ୍ତରଙ୍କୁ ଦେଖାନ୍ତୁ। ଆପଣ ଟୋକନ୍ ବୁକ୍ କରିପାରିବେ ବା ନିଜ ମେଡିକାଲ ରେକର୍ଡ ବିଷୟରେ ପଚାରିପାରିବେ।', 'ଏହି ଦଲିଲରେ ଲିପିବଦ୍ଧ ସୂଚନା:', 'ଏହା କେବଳ ଦଲିଲର ସୂଚନାର ବ୍ୟାଖ୍ୟା — ଏହା ଚିକିତ୍ସା ନିର୍ଣ୍ଣୟ ନୁହେଁ। ଫଳାଫଳ ଓ ପରବର୍ତ୍ତୀ ପଦକ୍ଷେପ ପାଇଁ ନିଜ ଡାକ୍ତରଙ୍କ ପରାମର୍ଶ ନିଅନ୍ତୁ।', 'ଏହି ଦଲିଲର ବିବରଣୀ ମୁଁ ସ୍ପଷ୍ଟ ଭାବେ ପଢ଼ିପାରିଲି ନାହିଁ। ଆପଣ ରେକର୍ଡ ଖୋଲି ମୂଳ ଫାଇଲ୍ ଦେଖିପାରିବେ କିମ୍ବା ବିବରଣୀ ନିଜେ ସଂଶୋଧନ କରିପାରିବେ।'),
  Punjabi: G('AI ਤੋਂ ਮਿਲੀ ਜਾਣਕਾਰੀ ਸਿਰਫ਼ ਆਮ ਮਾਰਗਦਰਸ਼ਨ ਲਈ ਹੈ। ਇਹ ਡਾਕਟਰ ਦੀ ਸਲਾਹ ਦਾ ਬਦਲ ਨਹੀਂ ਹੈ।', 'ਤੁਹਾਡਾ ਸਵਾਲ ਗੰਭੀਰ ਸਮੱਸਿਆ ਦਾ ਸੰਕੇਤ ਹੋ ਸਕਦਾ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਫੌਰਨ ਨਜ਼ਦੀਕੀ ਹਸਪਤਾਲ ਦੀ ਐਮਰਜੈਂਸੀ ਵਿੱਚ ਜਾਓ।', 'ਬੁਖ਼ਾਰ ਵਿੱਚ ਆਰਾਮ ਕਰੋ ਅਤੇ ਖ਼ੂਬ ਤਰਲ (ਪਾਣੀ, ORS) ਲਵੋ। ਕਿਹੜੀ ਦਵਾਈ ਅਤੇ ਕਿੰਨੀ ਮਾਤਰਾ ਲੈਣੀ ਹੈ, ਇਹ ਤੁਹਾਡੀ ਉਮਰ, ਲੱਛਣਾਂ, ਐਲਰਜੀ ਅਤੇ ਹੋਰ ਦਵਾਈਆਂ ਉੱਤੇ ਨਿਰਭਰ ਕਰਦਾ ਹੈ — ਇਸ ਲਈ ਦਵਾਈ ਲੈਣ ਤੋਂ ਪਹਿਲਾਂ ਡਾਕਟਰ ਜਾਂ ਫਾਰਮਾਸਿਸਟ ਨਾਲ ਸਲਾਹ ਕਰੋ। ਬੁਖ਼ਾਰ 3 ਦਿਨਾਂ ਤੋਂ ਵੱਧ ਰਹੇ, ਬਹੁਤ ਵੱਧ ਹੋਵੇ, ਜਾਂ ਨਾਲ ਦਾਣੇ, ਗਿੱਚੀ ਅਕੜਨ, ਬੇਹੋਸ਼ੀ ਵਰਗੀ ਹਾਲਤ ਜਾਂ ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼ ਹੋਵੇ ਤਾਂ ਡਾਕਟਰ ਨੂੰ ਮਿਲੋ।', 'ਖੰਘ-ਜ਼ੁਕਾਮ ਵਿੱਚ ਗੁਨਗੁਨਾ ਪਾਣੀ, ਆਰਾਮ ਅਤੇ ਭਾਫ਼ ਲੈਣਾ ਆਰਾਮ ਦਿੰਦਾ ਹੈ। ਸ਼ਹਿਦ ਗਲੇ ਨੂੰ ਰਾਹਤ ਦੇ ਸਕਦਾ ਹੈ (1 ਸਾਲ ਤੋਂ ਛੋਟੇ ਬੱਚਿਆਂ ਨੂੰ ਸ਼ਹਿਦ ਨਾ ਦਿਓ)। ਸਾਹ ਫੁੱਲਣਾ, ਛਾਤੀ ਵਿੱਚ ਦਰਦ, ਖੰਘ ਵਿੱਚ ਖ਼ੂਨ ਜਾਂ 2 ਹਫ਼ਤਿਆਂ ਤੋਂ ਵੱਧ ਲੱਛਣ ਹੋਣ ਤਾਂ ਡਾਕਟਰ ਨੂੰ ਮਿਲੋ।', 'ਗਲਾ ਦਰਦ ਵਿੱਚ ਗੁਨਗੁਨੇ ਲੂਣ-ਪਾਣੀ ਨਾਲ ਗਾਰਗਲ ਕਰੋ, ਗਰਮ ਤਰਲ ਲਵੋ ਅਤੇ ਆਰਾਮ ਕਰੋ। ਨਿਗਲਣ ਵਿੱਚ ਬਹੁਤ ਤਕਲੀਫ਼, ਤੇਜ਼ ਬੁਖ਼ਾਰ ਜਾਂ ਗਲੇ ਦੇ ਇੱਕ ਪਾਸੇ ਜ਼ਿਆਦਾ ਦਰਦ/ਸੋਜ ਹੋਵੇ ਤਾਂ ਡਾਕਟਰ ਨੂੰ ਮਿਲੋ।', 'ਪਾਣੀ ਦੀ ਕਮੀ ਵਿੱਚ ਥੋੜਾ-ਥੋੜਾ ਪਾਣੀ ਜਾਂ ORS ਪੀਓ ਅਤੇ ਠੰਡੀ ਥਾਂ ਆਰਾਮ ਕਰੋ। ਸੁੱਕਾ ਮੂੰਹ, ਗੂੜ੍ਹਾ ਪੀਲਾ ਪਿਸ਼ਾਬ, ਚੱਕਰ ਆਉਣੇ ਜਾਂ ਬਹੁਤ ਘੱਟ ਪਿਸ਼ਾਬ ਚੇਤਾਵਨੀ ਹੈ। ਨਵਜੰਮੇ ਬੱਚੇ, ਬੁੱਢੇ, ਜਾਂ ਜਿਨ੍ਹਾਂ ਨੂੰ ਪਾਣੀ ਪੀਂਦੇ ਹੀ ਉਲਟੀ ਹੋ ਜਾਵੇ — ਉਨ੍ਹਾਂ ਨੂੰ ਫੌਰਨ ਡਾਕਟਰ ਕੋਲ ਲਿਜਾਓ।', 'ਆਮ ਸਿਰਦਰਦ ਵਿੱਚ ਸ਼ਾਂਤ, ਘੱਟ ਰੋਸ਼ਨੀ ਵਾਲੀ ਥਾਂ ਆਰਾਮ ਕਰੋ, ਪਾਣੀ ਪੀਓ ਅਤੇ ਮੋਬਾਈਲ/ਸਕਰੀਨ ਤੋਂ ਦੂਰ ਰਹੋ। ਅਚਾਨਕ ਬਹੁਤ ਤੇਜ਼ ਸਿਰਦਰਦ, ਸਿਰ ਦੀ ਸੱਟ ਤੋਂ ਬਾਅਦ ਦਰਦ, ਬੁਖ਼ਾਰ ਨਾਲ ਗਿੱਚੀ ਅਕੜਨ, ਧੁੰਦਲਾ ਦਿਖਣਾ, ਕਮਜ਼ੋਰੀ ਜਾਂ ਉਲਟੀ ਹੋਵੇ ਤਾਂ ਫੌਰਨ ਡਾਕਟਰ ਨੂੰ ਮਿਲੋ।', 'ਪੇਟ ਦੀ ਆਮ ਤਕਲੀਫ਼ ਵਿੱਚ ਹਲਕਾ ਖਾਣਾ, ਖ਼ੂਬ ਪਾਣੀ ਅਤੇ ਆਰਾਮ ਨਾਲ ਫ਼ਾਇਦਾ ਹੁੰਦਾ ਹੈ। ਦਸਤ/ਉਲਟੀ ਵਿੱਚ ORS ਲੈਂਦੇ ਰਹੋ। ਖ਼ੂਨ ਵਾਲੀ ਦਸਤ/ਉਲਟੀ, ਤੇਜ਼ ਦਰਦ, ਤੇਜ਼ ਬੁਖ਼ਾਰ, ਜਾਂ ਪਾਣੀ ਵੀ ਨਾ ਰੁਕੇ ਤਾਂ ਫੌਰਨ ਡਾਕਟਰ ਕੋਲ ਜਾਓ।', 'ਛੋਟੇ ਲਾਗੇ ਨੂੰ ਸਾਫ਼ ਵਗਦੇ ਪਾਣੀ ਨਾਲ ਧੋਵੋ ਅਤੇ ਸਾਫ਼ ਕੱਪੜੇ/ਪੱਟੀ ਨਾਲ ਢੱਕੋ। ਡੂੰਘਾ ਲਾਗਾ, ਬਹੁਤ ਖ਼ੂਨ, ਸੋਜ-ਮਵਾਦ, ਜਾਂ ਜਾਨਵਰ ਦਾ ਕੱਟਣਾ (ਟੈਟਨਸ/ਰੇਬੀਜ਼ ਦਾ ਖ਼ਤਰਾ) ਹੋਵੇ ਤਾਂ ਜਲਦੀ ਡਾਕਟਰ ਨੂੰ ਮਿਲੋ।', 'ਸਹੀ ਦਵਾਈ ਅਤੇ ਖ਼ੁਰਾਕ ਤੁਹਾਡੀ ਉਮਰ, ਭਾਰ, ਲੱਛਣਾਂ, ਐਲਰਜੀ, ਮੌਜੂਦਾ ਬੀਮਾਰੀਆਂ, ਗਰਭ ਅਵਸਥਾ ਅਤੇ ਹੋਰ ਦਵਾਈਆਂ ਉੱਤੇ ਨਿਰਭਰ ਕਰਦੀ ਹੈ — ਇਸ ਲਈ ਮੈਂ ਦਵਾਈ ਦਾ ਨਾਮ ਜਾਂ ਮਾਤਰਾ ਨਹੀਂ ਦੱਸ ਸਕਦਾ। ਕਿਰਪਾ ਕਰਕੇ ਯੋਗ ਡਾਕਟਰ ਜਾਂ ਫਾਰਮਾਸਿਸਟ ਨਾਲ ਸਲਾਹ ਕਰੋ। ਕੋਈ ਵੀ ਦਵਾਈ ਖ਼ੁਦ ਬਦਲੋ ਜਾਂ ਬੰਦ ਨਾ ਕਰੋ।', 'ਡਾਕਟਰ ਨੂੰ ਕਦੋਂ ਮਿਲੀਏ: ਲੱਛਣ ਵੱਧਣ ਜਾਂ ਲੰਮਾ ਸਮਾਂ ਰਹਿਣ ਉੱਤੇ, ਤੇਜ਼ ਬੁਖ਼ਾਰ, ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼, ਛਾਤੀ ਵਿੱਚ ਦਰਦ, ਬੇਹੋਸ਼ੀ, ਵਾਰ-ਵਾਰ ਉਲਟੀ, ਪਿਸ਼ਾਬ/ਮਲ ਵਿੱਚ ਖ਼ੂਨ, ਜਾਂ ਨਵਜੰਮੇ ਬੱਚੇ/ਗਰਭਵਤੀ/ਬੁੱਢੇ ਬਾਰੇ ਚਿੰਤਾ ਹੋਵੇ। ਸ਼ੱਕ ਹੋਵੇ ਤਾਂ ਜਲਦੀ ਜਾਂਚ ਕਰਵਾਉਣਾ ਹਮੇਸ਼ਾ ਬਿਹਤਰ ਹੈ।', 'ਮੈਂ ਆਮ ਸਿਹਤ ਜਾਣਕਾਰੀ ਦੇ ਸਕਦਾ ਹਾਂ — ਜਿਵੇਂ ਬੁਖ਼ਾਰ, ਖੰਘ, ਪਾਣੀ ਦੀ ਕਮੀ, ਦਵਾਈ ਦਾ ਸਮਾਂ ਜਾਂ ਰਿਪੋਰਟ ਸਮਝਣ ਬਾਰੇ। ਮੈਂ ਬੀਮਾਰੀ ਦੀ ਪਛਾਣ (ਡਾਇਗਨੋਸਿਸ) ਜਾਂ ਦਵਾਈ ਨਹੀਂ ਦੱਸ ਸਕਦਾ। ਨਿੱਜੀ ਸਲਾਹ ਲਈ ਡਾਕਟਰ ਨੂੰ ਮਿਲੋ। ਤੁਸੀਂ ਟੋਕਨ ਬੁੱਕ ਕਰ ਸਕਦੇ ਹੋ ਜਾਂ ਆਪਣੇ ਮੈਡੀਕਲ ਰਿਕਾਰਡ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ।', 'ਇਸ ਦਸਤਾਵੇਜ਼ ਵਿੱਚ ਦਰਜ ਜਾਣਕਾਰੀ:', 'ਇਹ ਸਿਰਫ਼ ਦਸਤਾਵੇਜ਼ ਦੀ ਜਾਣਕਾਰੀ ਸਮਝਾਉਣਾ ਹੈ — ਇਹ ਮੈਡੀਕਲ ਡਾਇਗਨੋਸਿਸ ਨਹੀਂ ਹੈ। ਰਿਪੋਰਟ ਅਤੇ ਅਗਲੇ ਕਦਮਾਂ ਲਈ ਆਪਣੇ ਡਾਕਟਰ ਨਾਲ ਸਲਾਹ ਕਰੋ।', 'ਮੈਂ ਇਸ ਦਸਤਾਵੇਜ਼ ਦੀ ਜਾਣਕਾਰੀ ਸਾਫ਼ ਨਹੀਂ ਪੜ੍ਹ ਸਕਿਆ। ਤੁਸੀਂ ਰਿਕਾਰਡ ਖੋਲ੍ਹ ਕੇ ਮੂਲ ਫ਼ਾਈਲ ਵੇਖ ਸਕਦੇ ਹੋ ਜਾਂ ਜਾਣਕਾਰੀ ਖ਼ੁਦ ਜੋੜ/ਸੋਧ ਸਕਦੇ ਹੋ।'),
  Assamese: G('AI-এ দিয়া তথ্য কেৱল সাধাৰণ পৰামৰ্শৰ বাবে। ই ডাক্তৰৰ পৰামৰ্শৰ বিকল্প নহয়।', 'আপোনাৰ প্ৰশ্নটো গুৰুতৰ সমস্যাৰ ইংগিত হ’ব পাৰে। অনুগ্ৰহ কৰি এতিয়াই ওচৰৰ হস্পিতালৰ ইমাৰ্জেন্সিলৈ যাওক।', 'জ্বৰত জিৰণি লওক আৰু প্ৰচুৰ তৰল (পানী, ORS) খাওক। কোনটো ঔষধ আৰু কিমান মাত্ৰা ল’ব, সেইটো আপোনাৰ বয়স, লক্ষণ, এলাৰ্জি আৰু অন্য ঔষধৰ ওপৰত নিৰ্ভৰ কৰে — গতিকে ঔষধ লোৱাৰ আগতে ডাক্তৰ বা ফাৰ্মাচিষ্টক সুধিব। জ্বৰ 3 দিনতকৈ অধিক থাকিলে, বহুত বেছি হ’লে, বা ৰেশ, ডিঙি টান, বিভ্ৰান্তি বা সাঁতোৰত অসুবিধা হ’লে ডাক্তৰক দেখুৱাওক।', 'কাহ-পাতেক চৰ্দিত গৰম তৰল, জিৰণি আৰু ভাপ লোৱাত আৰাম দিয়ে। মধুৱে ডিঙিত আৰাম দিয়ে (1 বছৰতকৈ সৰু ল’ৰা-ছোৱালীক মধু নিদিব)। সাঁতোৰত অসুবিধা, বুকুত বিষ, কাহৰ লগত তেজ বা লক্ষণ 2 সপ্তাহতকৈ অধিক থাকিলে ডাক্তৰক দেখুৱাওক।', 'ডিঙি বিষত মাজনীয়া গৰম লুণে-পানীৰে গাৰ্গল কৰক, গৰম তৰল খাওক আৰু জিৰণি লওক। গিলিবলৈ বহুত অসুবিধা, প্ৰবল জ্বৰ বা ডিঙিৰ এটা পাৰত তীব্ৰ বিষ/ফুলা থাকিলে ডাক্তৰক দেখুৱাওক।', 'পানীৰ অভাৱত অলপ অলপকৈ পানী বা ORS খাব আৰু ঠাণ্ডা ঠাইত জিৰণি লব। শুকান মুখ, গাঢ় হালধীয়া পিচল, মূৰ ঘূৰোৱা বা বহুত কম পিচল সতৰ্কবাণী। শিশু, বৃদ্ধ, বা তৰল ৰখাত অসমৰ্থ মানুহক সোনকালে ডাক্তৰৰ ওচৰলৈ নিব।', 'সাধাৰণ মূৰৰ বিষত শান্ত, কম পোহৰৰ ঠাইত জিৰণি লব, পানী খাব আৰু স্ক্ৰীনৰ পৰা আঁতৰত থাকিব। হঠাৎ প্ৰবল মূৰৰ বিষ, মূৰত আঘাতৰ পিছৰ বিষ, জ্বৰৰ লগত ডিঙি টান, দৃষ্টি অস্পষ্ট, দুৰ্বলতা বা বমি হ’লে এতিয়াই ডাক্তৰক দেখুৱাওক।', 'পেটৰ সাধাৰণ সমস্যাত হালকা খাদ্য, পানী আৰু জিৰণিত আৰাম পোৱা যায়। পাতল পায়খানা/বমিৰ সময়ত ORS লব। তেজৰ লগত বমি/পায়খানা, তীব্ৰ বিষ, প্ৰবল জ্বৰ বা তৰলো ৰখাত নোৱাৰিলে এতিয়াই ডাক্তৰৰ ওচৰলৈ যাব।', 'সৰু আঘাত পৰিষ্কাৰ বৈ থকা পানীৰে ধুই পৰিষ্কাৰ কাপোৰেৰে ঢাকিব। গভীৰ আঘাত, বেছি তেজ, ফুলা/পূ, বা জন্তুৱে কামোৰা হ’লে খৰখেদাকৈ ডাক্তৰক দেখুৱাওক।', 'সঠিক ঔষধ আৰু মাত্ৰা আপোনাৰ বয়স, ওজন, লক্ষণ, এলাৰ্জি, বৰ্তমানৰ ৰোগ, গৰ্ভাৱস্থা আৰু অন্য ঔষধৰ ওপৰত নিৰ্ভৰ কৰে — গতিকে মই ঔষধৰ নাম বা মাত্ৰা ক’ব নোৱাৰোঁ। যোগ্য ডাক্তৰ বা ফাৰ্মাচিষ্টৰ পৰামৰ্শ লওক। নিজে ঔষধ সলনি বা বন্ধ নকৰিব।', 'ডাক্তৰক কেতিয়া দেখুৱাব: লক্ষণ বাঢ়িলে বা দীৰ্ঘদিন থাকিলে, প্ৰবল জ্বৰ, সাঁতোৰত অসুবিধা, বুকুত বিষ, অজ্ঞান হোৱা, বাৰে বাৰে বমি, পিচল/মলত তেজ, বা শিশু/গৰ্ভৱতী/বৃদ্ধৰ বিষয়ে চিন্তা হ’লে। সন্দেহ থাকিলে আগতেই পৰীক্ষা কৰোৱাটো সুৰক্ষিত।', 'মই সাধাৰণ স্বাস্থ্য-তথ্য দিব পাৰোঁ — যেনে জ্বৰ, কাহ, পানীৰ অভাৱ, ঔষধৰ সময় বা ৰিপোৰ্ট বুজা বিষয়ে। মই ৰোগ নিৰ্ণয় বা ঔষধ দিব নোৱাৰোঁ। ব্যক্তিগত পৰামৰ্শৰ বাবে ডাক্তৰক দেখুৱাওক। আপুনি ট’কেন বুক কৰিব পাৰে বা নিজৰ মেডিকেল ৰেকৰ্ডৰ বিষয়ে সুধিব পাৰে।', 'এই নথিপত্ৰত লিপিবদ্ধ তথ্য:', 'ই কেৱল নথিপত্ৰৰ তথ্যৰ ব্যাখ্যা — ই চিকিৎসাগত ৰোগনিৰ্ণয় নহয়। ফলাফল আৰু পৰৱৰ্তী পদক্ষেপৰ বাবে ডাক্তৰৰ পৰামৰ্শ লওক।', 'এই নথিপত্ৰৰ তথ্য মই স্পষ্টকৈ পঢ়িব নোৱাৰিলোঁ। আপুনি ৰেকৰ্ড খুলি মূল ফাইলটো চাব পাৰে বা তথ্য নিজে সংশোধন কৰিব পাৰে।'),
  Urdu: G('اے آئی (AI) سے ملنے والی معلومات صرف عام رہنمائی کے لیے ہیں۔ یہ ڈاکٹر کی ہدایت کا متبادل نہیں ہے۔', 'آپ کا سوال کسی سنگین مسئلے کی طرف اشارہ ہو سکتا ہے۔ براہ کرم فوراً قریبی ہسپتال کی ایمرجنسی میں جائیں۔', 'بخار میں آرام کریں اور کثرت سے سیال (پانی، ORS) لیں۔ کون سی دوا اور کتنی مقدار لینی چاہیے، یہ آپ کی عمر، علامات، الرجی اور دوسری دواؤں پر منحصر ہے — اس لیے دوا لینے سے پہلے ڈاکٹر یا فارماسسٹ سے مشورہ کریں۔ بخار 3 دن سے زیادہ رہے، بہت زیادہ ہو، یا ساتھ خارش، گردن اکڑنا، بے ہوشی جیسی حالت یا سانس لینے میں دقت ہو تو ڈاکٹر سے ملیں۔', 'کھانسی-زکام میں ہلکا گرم پانی، آرام اور بھاپ لینا راحت دیتا ہے۔ شہد گلے کو آرام دے سکتا ہے (1 سال سے چھوٹے بچوں کو شہد نہ دیں)۔ سانس پھولنا، سینے میں درد، کھانسی میں خون یا 2 ہفتے سے زیادہ علامات ہوں تو ڈاکٹر سے ملیں۔', 'گلے کے درد میں ہلکے گرم نمک-پانی سے غرارے کریں، گرم سیال لیں اور آرام کریں۔ نگلنے میں بہت دقت، تیز بخار یا گلے کی ایک طرف شدید درد/سوجن ہو تو ڈاکٹر سے ملیں۔', 'پانی کی کمی میں تھوڑا تھوڑا پانی یا ORS پئیں اور ٹھنڈی جگہ آرام کریں۔ خشک منہ، گہرا پیلا پیشاب، چکر آنا یا بہت کم پیشاب وارننگ ہے۔ بچے، بوڑھے، یا جنہیں پانی پیتے ہی الٹی ہو جائے — انہیں فوراً ڈاکٹر کے پاس لے جائیں۔', 'عام سر درد میں پرسکون، کم روشنی والی جگہ آرام کریں، پانی پئیں اور موبائل/اسکرین سے فاصلہ رکھیں۔ اچانک بہت شدید سر درد، سر کی چوٹ کے بعد درد، بخار کے ساتھ گردن اکڑنا، دھندلا دیکھنا، کمزوری یا الٹی ہو تو فوراً ڈاکٹر سے ملیں۔', 'پیٹ کی عام تکلیف میں ہلکا کھانا، کثرت سے پانی اور آرام سے فائدہ ہوتا ہے۔ اسہال/الٹی میں ORS لیتے رہیں۔ خون والی الٹی/آنت، شدید درد، تیز بخار، یا پانی بھی نہ رکے تو فوراً ڈاکٹر کے پاس جائیں۔', 'چھوٹے زخم کو صاف بہتے پانی سے دھوئیں اور صاف کپڑے/پٹی سے ڈھکیں۔ گہرا زخم، بہت زیادہ خون، سوجن-پیپ، یا جانور کے کاٹنے (ٹیٹنس/ریبیز کا خطرہ) ہو تو جلدی ڈاکٹر سے ملیں۔', 'درست دوا اور مقدار آپ کی عمر، وزن، علامات، الرجی، موجودہ بیماریوں، حمل اور دوسری دواؤں پر منحصر ہے — اس لیے میں دوا کا نام یا مقدار نہیں بتا سکتا۔ براہ کرم مستند ڈاکٹر یا فارماسسٹ سے مشورہ کریں۔ کوئی دوا خود نہ بدلیں اور نہ بند کریں۔', 'ڈاکٹر سے کب ملیں: علامات بڑھیں یا زیادہ دیر رہیں، تیز بخار، سانس لینے میں دقت، سینے میں درد، بے ہوشی، بار بار الٹی، پیشاب/آنت میں خون، یا چھوٹے بچے/حاملہ/بوڑھے کے بارے میں فکر ہو۔ شک ہو تو جلدی جانچ کروانا ہمیشہ بہتر ہے۔', 'میں عام صحت کی معلومات دے سکتا ہوں — جیسے بخار، کھانسی، پانی کی کمی، دوا کا وقت یا رپورٹ سمجھنے کے بارے میں۔ میں بیماری کی شناخت (ڈائیگنوسس) یا دوا نہیں بتا سکتا۔ ذاتی مشورے کے لیے مستند ڈاکٹر سے ملیں۔ آپ ٹوکن بک کر سکتے ہیں یا اپنے میڈیکل ریکارڈ کے بارے میں پوچھ سکتے ہیں۔', 'اس دستاویز میں درج معلومات:', 'یہ صرف دستاویز کی معلومات سمجھانا ہے — یہ میڈیکل ڈائیگنوسس نہیں ہے۔ رپورٹ اور اگلے اقدامات کے لیے اپنے ڈاکٹر سے مشورہ کریں۔', 'میں اس دستاویز کی معلومات صاف نہیں پڑھ سکا۔ آپ ریکارڈ کھول کر اصل فائل دیکھ سکتے ہیں یا معلومات خود شامل/درست کر سکتے ہیں۔'),
};

const guidanceFor = (language) => HEALTH_GUIDANCE[language] || HEALTH_GUIDANCE.English;
const isAiLanguage = (language) => AI_LANGUAGE_NAMES.includes(language);

async function callAI(messages, maxTokens = 700) {
  if (!AI_API_KEY) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({ model: AI_MODEL, messages, temperature: 0.3, max_tokens: maxTokens }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!response.ok) return null;
    const body = await response.json();
    const text = body && body.choices && body.choices[0] && body.choices[0].message && body.choices[0].message.content;
    return typeof text === 'string' && text.trim() ? text.trim() : null;
  } catch (error) {
    return null;
  }
}

// Multilingual safety keyword sets (English + romanized Hindi + native scripts).
const EMERGENCY_PHRASES = ['emergency', 'chest pain', 'seene me dard', 'seenay me dard', 'सीने में दर्द', 'heart attack', 'dil ka daura', 'दिल का दौरा', 'not breathing', 'saans nahi', 'saans lene', 'सांस नहीं', 'सांस लेने', 'suffocat', 'unconscious', 'behosh', 'बेहोश', 'बेहोशी', 'heavy bleeding', 'blood not stopping', 'khoon nahi ruk', 'खून नहीं', 'खून बह', 'seizure', 'fits', 'daura', 'stroke', 'lakwa', 'लकवा', 'poison', 'zeher', 'ज़हर', 'जहर', 'snake bite', 'saanp', 'सांप', 'suicide', 'atmahatya', 'आत्महत्या', 'خون بہ', 'بے ہوش', 'سینے میں درد'];
const MEDICINE_ASK_PHRASES = ['which medicine', 'what medicine', 'which tablet', 'what tablet', 'which drug', 'dose of', 'dosage', 'how much medicine', 'kitni goli', 'kitni dawa', 'kitni davai', 'kitni khurak', 'kaunsi dawa', 'kaunsi davai', 'kaunsi medicine', 'konsi dawa', 'konsi davai', 'dawa kaunsi', 'davai kaunsi', 'dawa kya', 'davai kya', 'dawa khau', 'davai khau', 'dawa lu', 'davai lu', 'dawa le', 'kya davai', 'kya dawa', 'kya khau', 'davai batao', 'dawa batao', 'prescribe', 'prescription for', 'खुराक', 'कौन सी दवा', 'कौनसी दवा', 'कोनसी दवा', 'कौन सी दवाई', 'कैसी दवा', 'दवा खाऊं', 'दवाई खाऊं', 'क्या खाऊं', 'कितनी गोली', 'कितनी खुराक', 'dose', 'ডোজ', 'ডাক্তার কী ওষুধ', 'কোন ওষুধ', 'ఏ మందు', 'ఏ మాత్ర', 'कोणती औषध', 'किती मात्रा', 'எந்த மருந்து', 'எவ்வளவு அளவு', 'કઈ દવા', 'કેટલી માત્રા', 'ಯಾವ ಔಷಧ', 'ಎಷ್ಟು ಪ್ರಮಾಣ', 'ഏത് മരുന്ന്', 'എത്ര അളവ്', 'କେଉଁ ଔଷଧ', 'کون سی دوا', 'کتنی دوا'];
const TOPIC_PHRASES = {
  fever: ['fever', 'bukhar', 'bukhaar', 'बुखार', 'ताप', 'জ্বর', 'జ్వరం', 'ताप', 'காய்ச்சல்', 'તાવ', 'ಜ್ವರ', 'പനി', 'ଜ୍ୱର', 'ਬੁਖ਼ਾਰ', 'জ্বৰ', 'بخار'],
  cough: ['cough', 'cold', 'khansi', 'khaansi', 'zukam', 'jukaam', 'खांसी', 'जुकाम', 'कफ', 'কাশি', 'দম', 'దగ్గు', 'జలుబు', 'खोकला', 'सर्दी', 'இருமல்', 'ஜலதோஷ', 'ખાંસી', 'શરદી', 'ಕೆಮ್ಮು', 'ಶೀತ', 'ചുമ', 'ജലദോഷ', 'କାଶ', 'ਖੰਘ', 'ਜ਼ੁਕਾਮ', 'কাহ', 'খঙ', 'کھانسی', 'زکام'],
  throat: ['sore throat', 'throat', 'gala', 'gale me', 'गला', 'गले', 'গলা', 'গলে', 'గొంతు', 'घशात', 'घशाला', 'தொண்டை', 'ગળો', 'ગળા', 'ಗಂಟಲು', 'തൊണ്ട', 'ଗଳା', 'ਗਲਾ', 'ਗਲੇ', 'ডিঙি', 'گلہ', 'گلے'],
  dehydration: ['dehydrat', 'paani ki kami', 'pani ki kami', 'water loss', 'पानी की कमी', 'डिहाइड्रेशन', 'পানিশূন্যতা', 'నీటి లోపం', 'पाण्याची कमतरता', 'நீரிழப்பு', 'પાણીની ઉણપ', 'ನಿರ್ಜಲೀಕರಣ', 'നിർജലീകരണ', 'ପାଣି ଅଭାବ', 'ਪਾਣੀ ਦੀ ਕਮੀ', 'পানীৰ অভাৱ', 'پانی کی کمی'],
  headache: ['headache', 'sar dard', 'sir dard', 'मुंड', 'सिर दर्द', 'सर दर्द', 'माथा दुख', 'মাথা ব্যথা', 'মূৰৰ বিষ', 'తలనొప్పి', 'डोकेदुखी', 'தலைவலி', 'માથાનો દુખાવો', 'ತಲೆನೋವು', 'തലവേദന', 'ମୁଣ୍ଡ ବିନ୍ଧା', 'ਸਿਰਦਰਦ', 'মূৰৰ বিষ', 'سر درد'],
  stomach: ['stomach', 'vomiting', 'diarrhea', 'diarrhoea', 'loose motion', 'pet dukh', 'pet dard', 'ulti', 'दस्त', 'उल्टी', 'पेट', 'বমি', 'পেট', 'వాంతులు', 'కడుపు', 'उलट्या', 'पोट', 'வாந்தி', 'வயிறு', 'ઊલટી', 'પેટ', 'ವಾಂತಿ', 'ಹೊಟ್ಟೆ', 'ഛർദ്ദി', 'വയറ്', 'ବାନ୍ତି', 'ପେଟ', 'ਦਸਤ', 'ਉਲਟੀ', 'ਪੇਟ', 'বমি', 'پٹ', 'الٹی', 'پیٹ'],
  wound: ['wound', 'cut', 'injury', 'ghav', 'zakhm', 'bleeding', 'घाव', 'जख्म', 'कट', 'চোট', 'ক্ষত', 'గాయం', 'जखम', 'காயம்', 'வெட்டு', 'ઘા', 'ಗಾಯ', 'മുറിവ്', 'କ୍ଷତ', 'ਲਾਗ', 'ਜ਼ਖ਼ਮ', 'আঘাত', 'زخم'],
  whenDoctor: ['see a doctor', 'see doctor', 'when to go', 'doctor se kab', 'kab milna', 'should i go to', 'डॉक्टर से कब', 'डॉक्टर कब', 'কবে ডাক্তার', 'వైద్యుడిని ఎప్పుడు', 'डॉक्टरांना कधी', 'மருத்துவரை எப்போது', 'ડૉક્ટરને ક્યારે', 'ವೈದ್ಯರನ್ನು ಯಾವಾಗ', 'ഡോക്ടറെ എപ്പോൾ', 'ଡାକ୍ତରଙ୍କୁ କେବେ', 'ਡਾਕਟਰ ਨੂੰ ਕਦੋਂ', 'ডাক্তৰক কেতিয়া', 'ڈاکٹر سے کب']
};

const cleanText = (value, max = 2000) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);

const findMedicalRecord = (id) => db.medicalRecords.find((r) => r.id === id);
const medicalRecordView = (record) => {
  const { file, ...rest } = record;
  return { ...rest, file: file ? { name: file.name, type: file.type, size: file.size } : null };
};

const MEDICAL_CATEGORIES = ['Prescription', 'Blood Test', 'Medical Report', 'X-Ray', 'Scan', 'Discharge Summary', 'Doctor Visit', 'Other'];
const MEDICAL_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MEDICAL_MAX_SIZE = 4 * 1024 * 1024; // 4 MB (base64-inflated payload stays within the 8mb JSON limit)
const validateMedicalFile = (file) => {
  if (!file || typeof file !== 'object') return 'Please attach the document (photo or file).';
  if (!MEDICAL_FILE_TYPES.includes(file.type)) return 'Only JPG, JPEG, PNG or PDF documents are supported.';
  if (!Number.isFinite(Number(file.size)) || Number(file.size) <= 0) return 'The attached file is missing or empty.';
  if (Number(file.size) > MEDICAL_MAX_SIZE) return 'File is too large. Maximum size is 4 MB.';
  if (typeof file.data !== 'string' || !file.data.startsWith('data:')) return 'The document data is invalid.';
  if (file.data.length > Math.ceil((MEDICAL_MAX_SIZE * 4) / 3) + 256) return 'File is too large. Maximum size is 4 MB.';
  if (typeof file.name !== 'string' || !file.name.trim() || file.name.length > 200) return 'The file name is invalid.';
  return '';
};
const sanitizeFields = (fields) => {
  const clean = {};
  if (!fields || typeof fields !== 'object') return clean;
  ['patientName', 'hospitalName', 'doctorName', 'documentDate', 'diagnosis', 'testResults', 'advice', 'followUpDate'].forEach((key) => {
    const value = cleanText(fields[key], 300);
    if (value) clean[key] = value;
  });
  ['medicines', 'tests'].forEach((key) => {
    if (Array.isArray(fields[key])) {
      const items = fields[key].map((item) => cleanText(item, 200)).filter(Boolean).slice(0, 40);
      if (items.length) clean[key] = items;
    }
  });
  return clean;
};

app.post('/api/ask-aas', async (req, res) => {
  const question = cleanText((req.body && req.body.question) || '');
  const language = isAiLanguage(cleanText((req.body && req.body.language) || '', 40)) ? cleanText((req.body && req.body.language) || '', 40) : 'English';
  if (!question) return fail(res, 400, 'Please type a question first.');
  const g = guidanceFor(language);
  const q = question.toLowerCase();
  const has = (...phrases) => phrases.some((p) => q.includes(p));

  // Safety layer 1 — emergencies.
  if (has(...EMERGENCY_PHRASES)) {
    logAudit('Ask AAS: emergency guidance shown');
    return ok(res, { answer: g.urgent, safety: 'emergency', engine: 'safety', disclaimer: g.disclaimer });
  }

  // Safety layer 2 — medicine / prescription questions: never name a medicine or dose.
  if (has(...MEDICINE_ASK_PHRASES)) {
    logAudit('Ask AAS: medicine-safety guidance shown');
    return ok(res, { answer: g.medicineSafety, safety: 'medicine', engine: 'safety', disclaimer: g.disclaimer });
  }

  // Real AI path (only when AI_API_KEY is configured on the server).
  const systemPrompt = [
    'You are "AAS Assistant", a general health-information helper inside the AAS healthcare app for patients in India.',
    'STRICT SAFETY RULES:',
    '- You are NOT a doctor. Never diagnose a disease with certainty. Always recommend consulting a qualified doctor for diagnosis.',
    '- Never prescribe prescription-only medicines, never recommend doses, and never tell the user to start, stop or change any medicine. If asked which medicine to take, explain that the right medicine depends on age, weight, symptoms, allergies, existing conditions, pregnancy and other medicines, and advise consulting a doctor or pharmacist.',
    '- If the question suggests a medical emergency (chest pain, difficulty breathing, heavy bleeding, unconsciousness, seizure, stroke signs, poisoning, suicidal thoughts), tell the user to seek emergency care immediately.',
    '- Give simple, general self-care information (rest, fluids, ORS for dehydration) and mention clear warning signs for when to see a doctor.',
    `- Answer ONLY in ${language} using simple words a patient without medical training can understand. Keep it short (under 180 words), warm and clear.`,
    '- Never invent information.'
  ].join(' ');
  const aiAnswer = await callAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question }
  ]);
  if (aiAnswer) {
    logAudit('Ask AAS: AI answer served');
    return ok(res, { answer: aiAnswer, safety: 'normal', engine: 'ai', disclaimer: g.disclaimer });
  }

  // Offline demo engine — curated safe guidance, matched by topic.
  for (const [topic, phrases] of Object.entries(TOPIC_PHRASES)) {
    if (has(...phrases)) {
      logAudit(`Ask AAS: demo guidance (${topic})`);
      return ok(res, { answer: g[topic], safety: 'normal', engine: 'demo', disclaimer: g.disclaimer });
    }
  }
  logAudit('Ask AAS: demo general guidance');
  return ok(res, { answer: g.general, safety: 'normal', engine: 'demo', disclaimer: g.disclaimer });
});

app.post('/api/ask-aas-record', requireSession, async (req, res) => {
  const recordId = cleanText((req.body && req.body.recordId) || '', 80);
  const question = cleanText((req.body && req.body.question) || '', 1000);
  const language = isAiLanguage(cleanText((req.body && req.body.language) || '', 40)) ? cleanText((req.body && req.body.language) || '', 40) : 'English';
  const g = guidanceFor(language);

  let record = findMedicalRecord(recordId);
  let lines = [];
  let ocrText = '';
  if (record) {
    lines.push(`Title: ${record.title}`, `Type: ${record.category}`);
    if (record.documentDate) lines.push(`Date on document: ${record.documentDate}`);
    const f = record.fields || {};
    if (f.patientName) lines.push(`Patient name: ${f.patientName}`);
    if (f.hospitalName) lines.push(`Hospital/Clinic: ${f.hospitalName}`);
    if (f.doctorName) lines.push(`Doctor: ${f.doctorName}`);
    if (f.diagnosis) lines.push(`Diagnosis/Condition: ${f.diagnosis}`);
    if (Array.isArray(f.medicines) && f.medicines.length) lines.push(`Medicines: ${f.medicines.join(', ')}`);
    if (Array.isArray(f.tests) && f.tests.length) lines.push(`Tests: ${f.tests.join(', ')}`);
    if (f.testResults) lines.push(`Test results: ${f.testResults}`);
    if (f.advice) lines.push(`Advice/Instructions: ${f.advice}`);
    if (f.followUpDate) lines.push(`Follow-up date: ${f.followUpDate}`);
    if (record.notes) lines.push(`Notes: ${record.notes}`);
    ocrText = String(record.ocrText || '').slice(0, 2500);
    if (ocrText) lines.push('Text read from the document:', ocrText);
  } else {
    record = db.records.find((r) => String(r.id) === recordId);
    if (record) lines.push(`Title: ${record.title}`, `Type: ${record.type}`, `Date: ${record.date}`, `Details: ${record.detail}`);
  }

  if (!record || !lines.length) {
    return ok(res, { answer: g.recordNone, safety: 'record', engine: 'safety', disclaimer: g.disclaimer });
  }

  if (AI_API_KEY) {
    const answer = await callAI([
      { role: 'system', content: `You are "AAS Assistant". A patient shares a medical document (report/prescription) from their AAS Medical Records. Explain ONLY the information actually present in the document summary below, in simple ${language} words. Clearly state that you are explaining the document and not providing a medical diagnosis. Never diagnose, never prescribe medicines or doses; recommend discussing results and next steps with a qualified doctor. Keep it short (under 200 words). Document summary:\n${lines.join('\n').slice(0, 6000)}` },
      { role: 'user', content: question || `Explain this document in simple ${language}.` }
    ], 900);
    if (answer) {
      logAudit(`Ask AAS: record explanation served (${record.id})`);
      return ok(res, { answer, safety: 'record', engine: 'ai', disclaimer: g.disclaimer });
    }
  }

  const body = [g.recordIntro, ...lines.map((line) => `• ${line}`), g.recordNotDiagnosis, `— ${g.disclaimer}`].join('\n');
  logAudit(`Ask AAS: demo record explanation (${record.id})`);
  ok(res, { answer: body, safety: 'record', engine: 'demo', disclaimer: g.disclaimer });
});

// ── Medical Records — digital medical file (protected) ──────
app.get('/api/medical-records', requireSession, (_req, res) => {
  ok(res, db.medicalRecords.map(medicalRecordView));
});

app.post('/api/medical-records', requireSession, (req, res) => {
  const body = req.body || {};
  const title = cleanText(body.title, 120);
  const category = String(body.category || '').trim();
  if (!title) return fail(res, 400, 'Please give this record a title.');
  if (!MEDICAL_CATEGORIES.includes(category)) return fail(res, 400, 'Please choose a valid document type.');
  const fileError = validateMedicalFile(body.file);
  if (fileError) return fail(res, 400, fileError);
  const record = {
    id: `mr-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    title,
    category,
    documentDate: cleanText(body.documentDate, 40),
    notes: cleanText(body.notes, 2000),
    fields: sanitizeFields(body.fields),
    ocrText: cleanText(body.ocrText, 8000),
    file: { name: body.file.name.trim(), type: body.file.type, size: Number(body.file.size), data: body.file.data },
    createdAt: new Date().toISOString()
  };
  db.medicalRecords.unshift(record);
  logAudit(`Medical record "${record.title}" saved (${record.category})`);
  pushNotification({ kind: 'Medical record', icon: 'test', title: 'Medical record saved', body: `${record.title} · ${record.category} was added to your Medical Records.` });
  ok(res, medicalRecordView(record));
});

app.get('/api/medical-records/:id', requireSession, (req, res) => {
  const record = findMedicalRecord(req.params.id);
  if (!record) return fail(res, 404, 'Medical record not found.');
  ok(res, medicalRecordView(record));
});

app.get('/api/medical-records/:id/document', requireSession, (req, res) => {
  const record = findMedicalRecord(req.params.id);
  if (!record) return fail(res, 404, 'Medical record not found.');
  ok(res, record.file);
});

app.delete('/api/medical-records/:id', requireSession, (req, res) => {
  const record = findMedicalRecord(req.params.id);
  if (!record) return fail(res, 404, 'Medical record not found.');
  db.medicalRecords = db.medicalRecords.filter((r) => r.id !== record.id);
  logAudit(`Medical record "${record.title}" deleted`);
  ok(res, { deleted: true, id: record.id });
});

app.post('/api/medical-records/extract', requireSession, async (req, res) => {
  const file = req.body && req.body.file;
  const fileError = validateMedicalFile(file);
  if (fileError) return fail(res, 400, fileError);
  const isImage = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
  if (AI_API_KEY && isImage) {
    const answer = await callAI([
      { role: 'system', content: 'You are a document-extraction engine for a medical records app. Extract fields that are CLEARLY present in the document image. Return STRICT JSON only, no markdown, with this shape: {"patientName":"","hospitalName":"","doctorName":"","documentDate":"","diagnosis":"","medicines":[],"tests":[],"testResults":"","advice":"","followUpDate":""}. Use "" or [] when a field is not clearly present. NEVER guess or invent information.' },
      { role: 'user', content: [
        { type: 'text', text: 'Extract the medical document fields as strict JSON.' },
        { type: 'image_url', image_url: { url: file.data } }
      ] }
    ], 900);
    if (answer) {
      try {
        const json = JSON.parse(answer.replace(/```json|```/g, '').trim());
        return ok(res, { engine: 'ai', fields: sanitizeFields(json) });
      } catch (error) { /* fall through to manual */ }
    }
  }
  ok(res, { engine: 'manual', fields: null, message: 'Automatic reading is not available for this document. Please review and type the details yourself below.' });
});

// 404 for unknown API routes.
app.use('/api', (_req, res) => fail(res, 404, 'Not found.'));

app.listen(PORT, '0.0.0.0', () => console.log(`AAS demo API running on http://localhost:${PORT}`));
