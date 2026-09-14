// ─────────────────────────────────────────────────────────────
// AAS · Advanced Alied Service — demo API server (Express)
// Prototype only: in-memory demo data, mock OTP, simulated
// Ayushman status. No real government/PM-JAY integration.
// ─────────────────────────────────────────────────────────────
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;
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

// 404 for unknown API routes.
app.use('/api', (_req, res) => fail(res, 404, 'Not found.'));

app.listen(PORT, '0.0.0.0', () => console.log(`AAS demo API running on http://localhost:${PORT}`));
