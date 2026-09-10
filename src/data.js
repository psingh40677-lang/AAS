// ─────────────────────────────────────────────────────────────
// AAS · Advanced Alied Service — central demo data for the prototype
// ALL PATIENT INFORMATION HERE IS FICTIONAL DEMO DATA (SIH hackathon).
// No real beneficiary, hospital or government data is used.
// ─────────────────────────────────────────────────────────────

import {
  Activity, BadgeCheck, CalendarDays, CloudSun, HeartPulse, Hospital,
  IdCard, Moon, Phone, Pill, Search, ShieldCheck, Stethoscope, Sun,
  TestTube2, Ticket, User
} from 'lucide-react';

// Translation-ready strings. The real product ships English, Hindi and
// regional languages from this single object (see README).
export const strings = {
  dashboard: 'Dashboard',
  home: 'Home',
  tokens: 'Tokens',
  bookToken: 'Book Token',
  ayushman: 'Ayushman Card',
  records: 'Health Records',
  prescription: 'Prescription',
  medicines: 'Medicines',
  notifications: 'Notifications',
  askAAS: 'Ask AAS',
  consent: 'Your Data',
  audit: 'Recent Activity',
  profile: 'Profile'
};

export const t = (key) => strings[key] || key;

// ── Patient (demo) ────────────────────────────────────────────
export const patient = {
  name: 'Pooja Singh',
  firstName: 'Pooja',
  age: 58,
  mobile: '+91 98765 43210',
  abha: 'Demo ABHA ···· 1234',
  initials: 'RS'
};

// ── Hospitals & booking options (demo) ───────────────────────
export const hospitals = [
  {
    id: 'district',
    name: 'District Hospital',
    type: 'Government hospital',
    empanelled: true,
    distance: '2.1 km',
    address: 'Station Road, Sector 12 (demo address)',
    contact: 'Demo help desk · 14555',
    open: 'Open today · 8:00 AM – 8:00 PM',
    departments: ['General Medicine', 'Cardiology', 'Orthopedics', 'Ophthalmology'],
    services: ['OPD tokens', 'Ayushman help counter', 'Pharmacy', 'Diagnostics', '24×7 emergency']
  },
  {
    id: 'chc',
    name: 'Community Health Centre',
    type: 'Government hospital',
    empanelled: true,
    distance: '5.4 km',
    address: 'Main Market Road (demo address)',
    contact: 'Demo help desk · 14555',
    open: 'Open today · 9:00 AM – 5:00 PM',
    departments: ['General Medicine', 'Orthopedics'],
    services: ['OPD tokens', 'Ayushman help counter', 'Basic diagnostics']
  },
  {
    id: 'citycare',
    name: 'City Care Hospital',
    type: 'Private hospital',
    empanelled: false,
    distance: '7.8 km',
    address: 'Civil Lines (demo address)',
    contact: 'Demo front desk',
    open: 'Open today · 9:00 AM – 9:00 PM',
    departments: ['General Medicine', 'Cardiology', 'Ophthalmology'],
    services: ['OPD tokens', 'Diagnostics', 'Pharmacy']
  }
];

export const departments = [
  { name: 'General Medicine', icon: 'stethoscope', note: 'Everyday consultations' },
  { name: 'Cardiology', icon: 'heart', note: 'Heart and blood pressure' },
  { name: 'Orthopedics', icon: 'activity', note: 'Bones and joints' },
  { name: 'Ophthalmology', icon: 'search', note: 'Eye care' }
];

// Doctor schedules are demo data. A real implementation should read these
// slots from the hospital scheduling system.
export const doctorAvailability = {
  'General Medicine': [
    { id: 'verma', name: 'Dr. A. Verma', role: 'General Physician', slots: ['10:30 AM', '12:00 PM'] },
    { id: 'rao', name: 'Dr. S. Rao', role: 'General Physician', slots: ['9:00 AM', '11:30 AM'] }
  ],
  Cardiology: [
    { id: 'mehta', name: 'Dr. N. Mehta', role: 'Cardiologist', slots: ['10:30 AM', '11:30 AM'] },
    { id: 'kapoor', name: 'Dr. P. Kapoor', role: 'Cardiologist', slots: ['9:00 AM'] }
  ],
  Orthopedics: [
    { id: 'singh', name: 'Dr. R. Singh', role: 'Orthopedic specialist', slots: ['9:00 AM', '10:30 AM'] },
    { id: 'jain', name: 'Dr. M. Jain', role: 'Orthopedic specialist', slots: ['12:00 PM'] }
  ],
  Ophthalmology: [
    { id: 'shah', name: 'Dr. K. Shah', role: 'Ophthalmologist', slots: ['10:30 AM', '11:30 AM'] },
    { id: 'iyer', name: 'Dr. T. Iyer', role: 'Ophthalmologist', slots: ['9:00 AM', '12:00 PM'] }
  ]
};

export const doctorsAvailable = [
  { id: 'verma', name: 'Dr. A. Verma', specialization: 'General Physician', department: 'General Medicine', sector: 'Public healthcare', master: 'MD Medicine', experience: '12 years', workingYear: 2014, room: 'Room 104', status: 'Available', timings: '9:00 AM – 1:00 PM', slots: ['09:00 AM', '10:30 AM', '11:30 AM'] },
  { id: 'rao', name: 'Dr. S. Rao', specialization: 'General Physician', department: 'General Medicine', sector: 'Public healthcare', master: 'MD General Medicine', experience: '9 years', workingYear: 2017, room: 'Room 106', status: 'Busy', timings: '10:00 AM – 2:00 PM', slots: ['10:30 AM', '11:30 AM'] },
  { id: 'mehta', name: 'Dr. N. Mehta', specialization: 'Cardiologist', department: 'Cardiology', sector: 'Public healthcare', master: 'DM Cardiology', experience: '15 years', workingYear: 2011, room: 'Room 202', status: 'Available', timings: '10:30 AM – 3:00 PM', slots: ['10:30 AM', '11:30 AM'] },
  { id: 'kapoor', name: 'Dr. P. Kapoor', specialization: 'Cardiologist', department: 'Cardiology', sector: 'Public healthcare', master: 'MD, DM Cardiology', experience: '11 years', workingYear: 2015, room: 'Room 204', status: 'Busy', timings: '9:00 AM – 12:00 PM', slots: ['09:00 AM', '10:30 AM'] },
  { id: 'singh', name: 'Dr. R. Singh', specialization: 'Orthopedic specialist', department: 'Orthopedics', sector: 'Public healthcare', master: 'MS Orthopedics', experience: '14 years', workingYear: 2012, room: 'Room 302', status: 'Available', timings: '9:00 AM – 1:00 PM', slots: ['09:00 AM', '10:30 AM'] },
  { id: 'shah', name: 'Dr. K. Shah', specialization: 'Ophthalmologist', department: 'Ophthalmology', sector: 'Public healthcare', master: 'MS Ophthalmology', experience: '10 years', workingYear: 2016, room: 'Room 401', status: 'Available', timings: '10:30 AM – 4:00 PM', slots: ['10:30 AM', '11:30 AM'] }
];

export const hospitalAvailabilitySeed = [
  {
    id: 'city-general',
    name: 'City General Hospital',
    location: 'Raipur',
    address: 'Sector 12, Station Road, Raipur',
    contact: '+91 771 245 5500',
    totalBeds: 500,
    occupiedBeds: 425,
    icuBeds: 8,
    emergencyBeds: 12,
    lastUpdated: '5 minutes ago',
    blood: { 'A+': 12, 'A-': 3, 'B+': 8, 'B-': 0, 'O+': 15, 'O-': 2, 'AB+': 6, 'AB-': 0 }
  },
  {
    id: 'district-availability',
    name: 'District Hospital',
    location: 'Raipur',
    address: 'Civil Lines, Raipur',
    contact: '+91 771 245 1455',
    totalBeds: 350,
    occupiedBeds: 332,
    icuBeds: 3,
    emergencyBeds: 4,
    lastUpdated: '8 minutes ago',
    blood: { 'A+': 5, 'A-': 0, 'B+': 4, 'B-': 2, 'O+': 9, 'O-': 0, 'AB+': 1, 'AB-': 0 }
  },
  {
    id: 'community-health',
    name: 'Community Health Centre',
    location: 'Durg',
    address: 'Main Market Road, Durg',
    contact: '+91 788 220 4400',
    totalBeds: 180,
    occupiedBeds: 110,
    icuBeds: 5,
    emergencyBeds: 9,
    lastUpdated: '12 minutes ago',
    blood: { 'A+': 8, 'A-': 1, 'B+': 6, 'B-': 1, 'O+': 11, 'O-': 3, 'AB+': 4, 'AB-': 1 }
  }
];

const getBookingDate = (offset) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return {
    value: [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-'),
    label: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }),
    year: date.getFullYear()
  };
};

export const bookingDates = [getBookingDate(0)];
export const bookingTimes = ['09:00 AM', '10:30 AM', '11:30 AM'];

// Tokens already issued today (demo) — the next booked token becomes #27.
export const tokensIssuedToday = 26;

// ── Health records timeline (demo) ───────────────────────────
export const records = [
  { id: 1, date: '05 Sep 2026', icon: 'stethoscope', title: 'General Medicine', type: 'Consultation', detail: 'Routine consultation. Vitals were normal. Continue current medicines and light daily exercise. Next review on 15 September.' },
  { id: 2, date: '28 Aug 2026', icon: 'test', title: 'CBC Report', type: 'Laboratory Report', detail: 'Complete blood count collected at the hospital lab. Values within the usual range (demo summary — the full product shows the official report).' },
  { id: 3, date: '28 Aug 2026', icon: 'pill', title: 'Prescription', type: '3 Medicines', detail: 'Prescribed by General Medicine. One dose each in the morning, afternoon and at night. See the prescription page for details.' },
  { id: 4, date: '10 Aug 2026', icon: 'calendar', title: 'Follow-up Visit', type: 'Consultation', detail: 'Follow-up visit completed. Doctor planned the next review for 15 September at General Medicine.' }
];

export const prescription = {
  department: 'General Medicine',
  date: '05 September 2026',
  doctor: 'Dr. A. Verma (demo)',
  medicines: [
    { id: 1, name: 'Medicine A', time: 'Morning', instruction: 'After breakfast' },
    { id: 2, name: 'Medicine B', time: 'Afternoon', instruction: 'Due at 2:00 PM' },
    { id: 3, name: 'Medicine C', time: 'Night', instruction: 'Due at 8:00 PM' }
  ]
};

// ── Medicines (demo) — status: 'taken' | 'pending' ───────────
export const initialMedicines = [
  { id: 1, name: 'Medicine A', time: 'Morning', status: 'taken', instruction: 'After breakfast', icon: 'sun' },
  { id: 2, name: 'Medicine B', time: 'Afternoon', status: 'pending', instruction: 'Due at 2:00 PM', icon: 'afternoon' },
  { id: 3, name: 'Medicine C', time: 'Night', status: 'pending', instruction: 'Due at 8:00 PM', icon: 'night' }
];

// ── Notifications (demo) ─────────────────────────────────────
export const initialNotifications = [
  { id: 1, kind: 'Ayushman verification', icon: 'idcard', title: 'Your Ayushman card is Active', body: 'Demo beneficiary status. Coverage can be used at empanelled hospitals.', unread: true },
  { id: 2, kind: 'Medicine reminder', icon: 'pill', title: 'Evening medicine is due', body: 'Medicine C is due at 8:00 PM.', unread: true },
  { id: 3, kind: 'Follow-up reminder', icon: 'stethoscope', title: 'Follow-up due in 5 days', body: 'Your next follow-up is at General Medicine.', unread: false }
];

// ── Audit log seed (demo) ────────────────────────────────────
export const initialAudit = [
  { id: 1, time: '10:25 AM', text: 'Prescription viewed' },
  { id: 2, time: '09:55 AM', text: 'Health record viewed' }
];

// ── Consent (demo) ───────────────────────────────────────────
export const consentItems = [
  { id: 'records', label: 'Hospital Records', note: 'Visits, reports and consultation summaries' },
  { id: 'appointments', label: 'Appointment Information', note: 'Token bookings and follow-up dates' },
  { id: 'ayushman', label: 'Ayushman-related Information', note: 'Card status used at empanelled hospitals' },
  { id: 'prescriptions', label: 'Prescriptions', note: 'Medicines prescribed for you' },
  { id: 'health', label: 'Health Information', note: 'Basic details shared with the AAS assistant' }
];

export const consentHistory = [
  { when: 'Today · 09:40 AM', text: 'All access reviewed — everything allowed' },
  { when: '01 September 2026', text: 'Prescriptions access granted' },
  { when: '20 August 2026', text: 'AAS demo account created' }
];

// ── Ayushman (demo) ──────────────────────────────────────────
export const ayushmanSeed = {
  status: 'active', // active | pending | notfound | failed
  scheme: 'Ayushman Bharat · PM-JAY (demo)',
  holder: 'Pooja Singh',
  number: 'XXXX XXXX XXXX',
  verified: false,
  history: [
    { when: '20 August 2026', text: 'Demo card generated' },
    { when: '05 September 2026', text: 'Status verified as Active (demo)' }
  ]
};

export const ayushmanStatuses = {
  active: { tone: 'success', icon: 'check', label: '✓ Active', copy: 'Your Ayushman Card is active.' },
  pending: { tone: 'warning', icon: 'dot', label: '● Verification Pending', copy: 'Your beneficiary details are being verified.' },
  notfound: { tone: 'warning', icon: 'alert', label: '! Card Not Found', copy: 'We couldn’t find a matching card.' },
  failed: { tone: 'error', icon: 'cross', label: '✕ Verification Failed', copy: 'Your details could not be verified. Please check your information and try again.' }
};

export const ayushmanUsageSeed = [
  { id: 'usage-1', type: 'Checkups', service: 'Doctor Checkup', medicine: '', hospital: 'District Hospital · General Medicine', date: '10 September 2026', amount: 500 },
  { id: 'usage-2', type: 'Tests', service: 'Blood Test', medicine: '', hospital: 'District Hospital · Diagnostics', date: '08 September 2026', amount: 300 },
  { id: 'usage-3', type: 'Medicines', service: 'Paracetamol', medicine: 'Paracetamol', hospital: 'District Hospital · Pharmacy', date: '07 September 2026', amount: 100 },
  { id: 'usage-4', type: 'Medicines', service: 'Antibiotic Medicine', medicine: 'Antibiotic Medicine', hospital: 'District Hospital · Pharmacy', date: '05 September 2026', amount: 250 },
  { id: 'usage-5', type: 'Tests', service: 'Diagnostic Test', medicine: '', hospital: 'District Hospital · Diagnostics', date: '02 September 2026', amount: 800 }
];

export const benefits = [
  { id: 1, icon: 'hospital', title: 'Hospitalization', copy: 'Cashless treatment at empanelled hospitals for covered procedures (demo).' },
  { id: 2, icon: 'heart', title: 'Treatment', copy: 'Covered healthcare packages across participating specialties (demo).' },
  { id: 3, icon: 'test', title: 'Diagnostics', copy: 'Applicable diagnostic services where supported by the scheme (demo).' },
  { id: 4, icon: 'pill', title: 'Medicines', copy: 'Medicine-related benefits during covered hospital episodes (demo).' },
  { id: 5, icon: 'shield', title: 'Financial Protection', copy: 'Eligible beneficiaries receive protection under the scheme rules (demo).' }
];

export const helpTopics = [
  { id: 'status', icon: 'idcard', title: 'Card status', copy: 'Check whether your Ayushman card is active.', to: 'ayushman' },
  { id: 'hospital', icon: 'hospital', title: 'Find a hospital', copy: 'Locate empanelled hospitals near you.', to: 'hospitals' },
  { id: 'documents', icon: 'user', title: 'Documents', copy: 'See beneficiary and card documents.', to: 'documents' },
  { id: 'eligibility', icon: 'check', title: 'Eligibility', copy: 'Learn how the demo eligibility check works.', to: 'eligibility' },
  { id: 'support', icon: 'phone', title: 'Support', copy: 'Reach the demo help desk for Ayushman questions.', to: null }
];

export const documents = [
  { id: 'card', icon: 'idcard', title: 'Ayushman Card', note: 'View or download your demo card' },
  { id: 'beneficiary', icon: 'user', title: 'Beneficiary Information', note: 'Name, age and demo ID details' },
  { id: 'hospital', icon: 'hospital', title: 'Hospital Information', note: 'Empanelled facilities near you' },
  { id: 'treatment', icon: 'heart', title: 'Treatment / Service Information', note: 'Services linked to your visits (demo)' }
];

// ── Icon maps (single source so pages stay consistent) ───────
export const recordIcons = {
  stethoscope: Stethoscope,
  test: TestTube2,
  pill: Pill,
  calendar: CalendarDays
};

export const slotIcons = {
  sun: Sun,
  afternoon: CloudSun,
  night: Moon
};

export const deptIcons = {
  stethoscope: Stethoscope,
  heart: HeartPulse,
  activity: Activity,
  search: Search
};

export const notificationIcons = {
  ticket: Ticket,
  pill: Pill,
  stethoscope: Stethoscope,
  idcard: IdCard
};

export const benefitIcons = {
  hospital: Hospital,
  heart: HeartPulse,
  test: TestTube2,
  pill: Pill,
  shield: ShieldCheck
};

export const helpIcons = {
  idcard: IdCard,
  hospital: Hospital,
  user: User,
  check: BadgeCheck,
  phone: Phone
};

export const documentIcons = {
  idcard: IdCard,
  user: User,
  hospital: Hospital,
  heart: HeartPulse
};

// Adherence helper — supportive, never guilt-inducing.
export const adherenceFor = (medicines) => {
  const taken = medicines.filter((m) => m.status === 'taken').length;
  return medicines.length ? Math.round((taken / medicines.length) * 100) : 100;
};
