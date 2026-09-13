import { useEffect, useState } from 'react';
import {
  Bell, Bot, Check, ChevronRight, ClipboardList, HeartPulse, HelpCircle,
  Hospital, Home, IdCard, Menu, Pill, ShieldCheck, Stethoscope, Ticket, UserRound, X
} from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { TokenBooking, TokenConfirmation } from './pages/TokenPages';
import { Records, Prescription, Medicines } from './pages/HealthPages';
import { Notifications, Consent, Audit, Profile } from './pages/SupportPages';
import {
  AyushmanHome, Eligibility, Benefits, Hospitals, HospitalDetail,
  AyushmanHelp, Documents
} from './pages/AyushmanPages';
import AskAAS from './pages/AskAAS';
import DoctorsAvailable from './pages/DoctorsAvailable';
import { DoctorAppointmentBooking, DoctorAppointmentConfirmation } from './pages/DoctorAppointmentPages';
import HospitalAvailability from './pages/HospitalAvailability';
import { PharmacyOrder, PharmacyOrderConfirmation, PharmacyStaff } from './pages/PharmacyPages';
import BedAvailability from './pages/BedAvailability';
import {
  initialAudit, initialMedicines, initialNotifications, ayushmanSeed, ayushmanUsageSeed, tokensIssuedToday
} from './data';
import { useLanguage } from './i18n';
import LanguageSelector from './components/LanguageSelector';
import { apiUrl } from './api';

const NAV = [
  { id: 'home', label: 'Home', t: 'home', icon: Home },
  { id: 'profile', label: 'Profile', t: 'profile', icon: UserRound },
  { id: 'tokens', label: 'Tokens', t: 'tokens', icon: Ticket },
  { id: 'doctors', label: 'Doctors Available', t: 'doctors', icon: Stethoscope },
  { id: 'hospital-availability', label: 'Hospital Availability', t: 'hospitalAvailability', icon: Hospital },
  { id: 'ayushman', label: 'Ayushman', t: 'ayushman', icon: IdCard },
  { id: 'records', label: 'Records', t: 'records', icon: ClipboardList },
  { id: 'medicines', label: 'Medicines', t: 'medicines', icon: Pill },
  { id: 'ask', label: 'Ask AAS', t: 'askAAS', icon: Bot }
];

const CRUMBS = {
  home: 'Overview', tokens: 'Hospital Tokens', book: 'Book Token',
  doctors: 'Doctors Available', 'bed-availability': 'Bed Availability', 'bed-staff': 'Bed Management',

  'hospital-availability': 'Hospital Availability',
  confirmation: 'Token Confirmation', ayushman: 'Ayushman Card',
  eligibility: 'Ayushman Eligibility', benefits: 'Ayushman Benefits',
  hospitals: 'Find Ayushman Hospital', 'hospital-detail': 'Hospital Details',
  'ayushman-help': 'Ayushman Help', documents: 'Documents & Card',
  records: 'Health Records', prescription: 'Prescription',
  medicines: "Today's Medicines", 'pharmacy-order': 'Place Pharmacy Order', 'pharmacy-status': 'Pharmacy Order Status', 'pharmacy-staff': 'Pharmacy Verification', notifications: 'Notifications',
  ask: 'Ask AAS', consent: 'Your Data & Consent', audit: 'Recent Activity',
  profile: 'Profile'
};

const nowTime = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const AYUSHMAN_STORAGE_KEY = 'aas-ayushman-demo';
const NOTIFICATIONS_STORAGE_KEY = 'aas-notifications-demo';
const loadAyushmanDemo = () => {
  const saved = window.localStorage.getItem(AYUSHMAN_STORAGE_KEY);
  if (!saved) return { healthId: '', usage: ayushmanUsageSeed };
  try {
    const parsed = JSON.parse(saved);
    return { healthId: parsed.healthId || '', usage: Array.isArray(parsed.usage) ? parsed.usage : ayushmanUsageSeed };
  } catch {
    return { healthId: '', usage: ayushmanUsageSeed };
  }
};
const loadNotifications = () => {
  const saved = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (!saved) return initialNotifications;
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : initialNotifications;
  } catch {
    return initialNotifications;
  }
};

export default function App() {
  const { language, t } = useLanguage();
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [page, setPage] = useState('home');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [token, setToken] = useState(null);
  const [pharmacyOrder, setPharmacyOrder] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [nextAppointmentNumber, setNextAppointmentNumber] = useState(tokensIssuedToday + 1);
  const [medicines, setMedicines] = useState(initialMedicines);
  const [notifications, setNotifications] = useState(loadNotifications);
  const [consents, setConsents] = useState({ records: true, appointments: true, ayushman: true, prescriptions: true, health: true });
  const [audit, setAudit] = useState(initialAudit);
  const [ayushman, setAyushman] = useState(ayushmanSeed);
  const [ayushmanDemo, setAyushmanDemo] = useState(loadAyushmanDemo);
  const [addedToMedicines, setAddedToMedicines] = useState(false);
  const [toast, setToast] = useState('');
  const [unreadNote, setUnreadNote] = useState(true);
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 560px)').matches);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 560px)');
    const update = () => setNarrow(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(AYUSHMAN_STORAGE_KEY, JSON.stringify(ayushmanDemo));
  }, [ayushmanDemo]);

  useEffect(() => {
    window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const go = (next) => { setPage(next); setMobileMenu(false); window.scrollTo({ top: 0 }); };

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(notify._timer);
    notify._timer = window.setTimeout(() => setToast(''), 2800);
  };

  const logAudit = (text) => setAudit((current) => [{ id: current.length + 1 + Math.random(), time: nowTime(), text }, ...current]);

  const pushNotification = (notification) => setNotifications((current) => [{ unread: true, ...notification }, ...current]);

  const createHealthId = (details) => {
    const healthId = `AAS-${details.name.trim().toUpperCase().replace(/\s+/g, '-').slice(0, 12)}-${Date.now().toString().slice(-6)}`;
    setAyushmanDemo((current) => ({ ...current, healthId }));
    const message = 'Demo Health ID successfully created';
    notify(message);
    pushNotification({ kind: 'Health ID', icon: 'idcard', title: 'Health ID created', body: `${message}: ${healthId}` });
  };

  const addAyushmanUsage = (usage) => {
    const nextUsage = { ...usage, id: `usage-${Date.now()}` };
    const remaining = Math.max(500000 - [...ayushmanDemo.usage, nextUsage].reduce((sum, item) => sum + Number(item.amount), 0), 0);
    setAyushmanDemo((current) => ({ ...current, usage: [nextUsage, ...current.usage] }));
    const message = `₹${Number(usage.amount).toLocaleString('en-IN')} was recorded for ${usage.service}. Your remaining demo benefit is ₹${remaining.toLocaleString('en-IN')}.`;
    notify(message);
    pushNotification({ kind: 'Ayushman usage', icon: 'idcard', title: 'Benefit balance updated', body: message });
  };

  // ── Actions ──────────────────────────────────────────────
  const markTaken = (id) => {
    setMedicines((current) => current.map((m) => (m.id === id ? { ...m, status: 'taken' } : m)));
    const medicine = medicines.find((m) => m.id === id);
    notify(`${medicine ? medicine.name : 'Medicine'} marked as taken ✓`);
    logAudit(`${medicine ? medicine.name : 'Medicine'} marked as taken`);
    fetch(apiUrl(`/api/medicines/${id}/taken`), { method: 'POST' }).catch(() => {});
  };

  const bookToken = async (details) => {
    try {
      const response = await fetch(apiUrl('/api/tokens'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Token booking failed.');
      setToken(result.data);
      go('confirmation');
      notify('Token booked successfully ✓');
      logAudit(`Token ${result.data.token} booked — ${result.data.department}${result.data.doctor ? ` with ${result.data.doctor}` : ''}`);
      pushNotification({
        kind: 'Token confirmed', icon: 'ticket',
        title: `${result.data.token} — ${result.data.department}`,
        body: `${result.data.doctor ? `${result.data.doctor} · ` : ''}${result.data.hospital} · ${result.data.date} at ${result.data.time}.`
      });
    } catch (error) {
      notify(error.message || 'Token booking failed.');
    }
  };

  const startDoctorAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    go('doctor-booking');
  };

  const confirmDoctorAppointment = ({ doctor, date, time }) => {
    const tokenNumber = nextAppointmentNumber;
    setNextAppointmentNumber((number) => number + 1);
    setAppointment({
      doctor,
      date,
      time,
      tokenNumber,
      queuePosition: '8 people ahead',
      status: 'Confirmed'
    });
    go('doctor-confirmation');
    notify('Appointment token booked successfully');
    logAudit(`Appointment token #${tokenNumber} booked with ${doctor.name}`);
  };

  const cancelDoctorAppointment = () => {
    setAppointment(null);
    setSelectedDoctor(null);
    go('doctors');
    notify('Appointment cancelled');
  };

  const addMedicines = () => {
    setAddedToMedicines(true);
    logAudit('Prescription added to medicine schedule');
    pushNotification({ kind: 'Medicine reminder', icon: 'pill', title: 'Medicine schedule updated', body: '3 medicines added from your prescription (demo).' });
  };

  const toggleConsent = (id) => {
    setConsents((current) => {
      const next = { ...current, [id]: !current[id] };
      logAudit(`Consent for ${id} ${next[id] ? 'allowed' : 'blocked'}`);
      return next;
    });
  };

  const markAllRead = () => { setNotifications((current) => current.map((n) => ({ ...n, unread: false }))); setUnreadNote(false); notify('All notifications marked as read'); };

  const logout = () => { setUser(null); setSessionToken(null); setPage('home'); setToken(null); };

  // ── Login gate ───────────────────────────────────────────
  if (!user) return <Login onLogin={(patient, authToken) => {
    if (!patient || !patient.name) {
      notify('Login failed. Please check your OTP and try again.');
      logAudit('Login failed');
      return;
    }
    setUser(patient);
    setSessionToken(authToken);
    notify('Namaste! You are logged in (demo)');
    logAudit('Patient logged in');
  }} />;

  const unreadCount = notifications.filter((n) => n.unread).length;
  const crumb = page === 'home' ? t('overview') : (CRUMBS[page] || t('overview'));

  const pageProps = {
    go, notify, token, medicines, markTaken, bookToken, addedToMedicines, addMedicines,
    selectedDoctor, appointment, onBookDoctor: startDoctorAppointment,
    onConfirm: confirmDoctorAppointment, onCancel: cancelDoctorAppointment,
    ayushman, ayushmanDemo, onCreateHealthId: createHealthId, onAddAyushmanUsage: addAyushmanUsage,
    pushNotification,
    notifications, consents, onToggle: toggleConsent, audit, unreadCount,
    onMarkAllRead: markAllRead, onLogout: logout, language, t,
    sessionToken, onProfileSaved: setUser, patient: user, pharmacyOrder,
    onOrderCreated: setPharmacyOrder
  };

  const PAGES = {
    home: Dashboard,
    tokens: TokenBooking,
    doctors: DoctorsAvailable,
    'hospital-availability': HospitalAvailability,
    'bed-availability': BedAvailability,
    'bed-staff': (props) => <BedAvailability {...props} staffMode />,
    'doctor-booking': DoctorAppointmentBooking,
    'doctor-confirmation': DoctorAppointmentConfirmation,
    confirmation: TokenConfirmation,
    ayushman: AyushmanHome,
    eligibility: Eligibility,
    benefits: Benefits,
    hospitals: Hospitals,
    'hospital-detail': HospitalDetail,
    'ayushman-help': AyushmanHelp,
    documents: Documents,
    records: Records,
    prescription: Prescription,
    medicines: Medicines,
    'pharmacy-order': PharmacyOrder,
    'pharmacy-status': PharmacyOrderConfirmation,
    'pharmacy-staff': PharmacyStaff,
    notifications: Notifications,
    ask: AskAAS,
    consent: Consent,
    audit: Audit,
    profile: Profile
  };
  const Page = PAGES[page] || Dashboard;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand"><a className="brand-logo-link" href="https://chatgpt.com/s/m_6aa2de813dd08191a582253feaf88a1f" target="_blank" rel="noreferrer" aria-label="AAS — Advance Alied Service"><span className="brand-heart" aria-hidden="true"><HeartPulse size={20} strokeWidth={2.4} /></span><span className="brand-copy"><strong>AAS</strong><small>Advance Alied Service</small></span></a></div>
        <div className="patient-mini"><span className="avatar">PS</span><div><strong>Pooja Singh</strong><span>Patient · demo account</span></div></div>
        <nav className="side-nav" aria-label="Primary navigation">
          <p className="nav-label">{t('yourHealth')}</p>
          {NAV.map(({ id, label, t: labelKey, icon: Icon }) => (
            <button key={id} className={`nav-button ${page === id ? 'active' : ''}`} onClick={() => go(id)}>
              <Icon size={18} /><span>{t(labelKey) || label}</span>
            </button>
          ))}
          <p className="nav-label nav-label-spaced">{t('more')}</p>
          <NavRow icon={Bell} label={t('notifications')} badge={unreadCount || null} active={page === 'notifications'} onClick={() => go('notifications')} />
          <NavRow icon={ShieldCheck} label={t('yourData')} active={page === 'consent'} onClick={() => go('consent')} />
        </nav>
        <div className="sidebar-help">
          <HelpCircle size={18} />
          <div>
            <strong>{t('needHelp')}</strong>
            <span>{t('askAnytime')}</span>
          </div>
          <ChevronRight size={16} />
        </div>
      </aside>

      {mobileMenu && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileMenu(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="crumb">{crumb}</div>
          <div className="top-actions">
            <LanguageSelector />
            <button className={`icon-button notification-button ${unreadNote && unreadCount ? 'has-unread' : ''}`} onClick={() => { go('notifications'); setUnreadNote(false); }} aria-label={`Notifications (${unreadCount} unread)`}>
              <Bell size={20} /><i />
            </button>
            <button className="profile-button" onClick={() => go('profile')}>
              <span className="avatar avatar-small">PS</span><span className="profile-name">Pooja</span><ChevronRight size={15} />
            </button>
          </div>
        </header>

        <div className="content-wrap"><Page {...pageProps} /></div>
      </main>

      {toast && (
        <div className="toast" role="status">
          <span className="toast-check"><Check size={15} /></span>{toast}
          <button onClick={() => setToast('')} aria-label="Dismiss"><X size={15} /></button>
        </div>
      )}

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {(narrow ? NAV.filter((item) => item.id !== 'ayushman') : NAV).map(({ id, label, t: labelKey, icon: Icon }) => (
          <button key={id} className={page === id ? 'active' : ''} onClick={() => go(id)} aria-label={label}>
            <Icon size={19} /><span>{t(labelKey) || label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function NavRow({ icon: Icon, label, badge, active, onClick }) {
  return (
    <button className={`nav-button ${active ? 'active' : ''}`} onClick={onClick}>
      <Icon size={18} /><span>{label}</span>{badge && <b>{badge}</b>}
    </button>
  );
}
