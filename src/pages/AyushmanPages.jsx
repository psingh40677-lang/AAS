import { useState } from 'react';
import {
  ArrowRight, BadgeCheck, Bell, Building2, CalendarDays, Check, Clipboard, Copy,
  Download, Eye, HeartPulse, Hospital as HospitalIcon, IdCard, Info, MapPin,
  Navigation, Phone, Plus, Search, ShieldCheck, X
} from 'lucide-react';
import { SectionHeading } from '../ui';
import {
  ayushmanStatuses, benefits, benefitIcons,
  documents, documentIcons, helpTopics, helpIcons, hospitals
} from '../data';

// ── Ayushman home: card, status, quick links ─────────────────
export function AyushmanHome({ ayushman, go, notify, unreadCount, ayushmanDemo, onCreateHealthId, onAddAyushmanUsage }) {
  const status = ayushmanStatuses[ayushman.status];
  const [showHealthIdForm, setShowHealthIdForm] = useState(false);
  const [showUsageForm, setShowUsageForm] = useState(false);
  const [selectedUsage, setSelectedUsage] = useState(null);
  const [showHealthId, setShowHealthId] = useState(false);
  const [filter, setFilter] = useState('All');
  const [healthIdError, setHealthIdError] = useState('');
  const [usageError, setUsageError] = useState('');
  const [healthIdName, setHealthIdName] = useState('');
  const [healthIdMobile, setHealthIdMobile] = useState('');
  const [usageForm, setUsageForm] = useState({ type: 'Checkups', service: '', medicine: '', amount: '', hospital: 'District Hospital · General Medicine' });
  const totalCoverage = 500000;
  const usedAmount = ayushmanDemo.usage.reduce((sum, usage) => sum + Number(usage.amount), 0);
  const remainingAmount = Math.max(totalCoverage - usedAmount, 0);
  const visibleUsage = filter === 'All' ? ayushmanDemo.usage : ayushmanDemo.usage.filter((usage) => usage.type === filter);
  const formatAmount = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;
  const remainingAfterUsage = (usageId) => {
    const chronological = ayushmanDemo.usage.slice().reverse();
    const usageIndex = chronological.findIndex((usage) => usage.id === usageId);
    if (usageIndex < 0) return remainingAmount;
    return Math.max(totalCoverage - chronological.slice(0, usageIndex + 1).reduce((sum, usage) => sum + Number(usage.amount), 0), 0);
  };
  const submitHealthId = (event) => {
    event.preventDefault();
    if (!healthIdName.trim() || healthIdMobile.replace(/\D/g, '').length < 10) {
      setHealthIdError('Enter your full name and a valid 10-digit mobile number.');
      return;
    }
    onCreateHealthId({ name: healthIdName, mobile: healthIdMobile });
    setHealthIdName('');
    setHealthIdMobile('');
    setHealthIdError('');
    setShowHealthIdForm(false);
  };
  const submitUsage = (event) => {
    event.preventDefault();
    const amount = Number(usageForm.amount);
    if (!usageForm.service.trim() || !Number.isFinite(amount) || amount <= 0) {
      setUsageError('Enter a service name and an amount greater than zero.');
      return;
    }
    if (amount > remainingAmount) {
      setUsageError(`Amount cannot exceed the remaining demo benefit of ${formatAmount(remainingAmount)}.`);
      return;
    }
    onAddAyushmanUsage({ ...usageForm, amount: Number(usageForm.amount), date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) });
    setUsageForm({ type: 'Checkups', service: '', medicine: '', amount: '', hospital: 'District Hospital · General Medicine' });
    setUsageError('');
    setShowUsageForm(false);
  };
  const copyHealthId = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(ayushmanDemo.healthId);
      } else {
        const input = document.createElement('textarea');
        input.value = ayushmanDemo.healthId;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
      }
      notify('Demo Health ID copied');
    } catch {
      notify('Unable to copy Health ID. Please select it manually.');
    }
  };
  return (
    <>
      <SectionHeading eyebrow="Ayushman Bharat · PM-JAY" title="Ayushman Card" copy="Check your card status, benefits and eligible healthcare services." />
      <div className="ayushman-layout">
        <section className="ayushman-card-visual">
          <div className="acv-top">
            <span className="acv-emblem"><ShieldCheck size={22} /></span>
            <div>
              <strong>Ayushman Bharat Health Card</strong>
              <span>Pradhan Mantri Jan Arogya Yojana · demo</span>
            </div>
            <span className="demo-chip dark">DEMO</span>
          </div>
          <div className="acv-status">
            <span className={`status-pill ${status.tone}`}>
              {status.label}
            </span>
            <p>{status.copy}</p>
          </div>
          <div className="acv-details">
            <div><small>Beneficiary</small><strong>{ayushman.holder}</strong></div>
            <div><small>Card Number</small><strong>{ayushman.number}</strong></div>
            <div><small>Scheme</small><strong>{ayushman.scheme}</strong></div>
          </div>
          <div className="acv-actions">
            <button className="chip-button" onClick={() => go('documents')}><Download size={14} /> View / download card</button>
            <button className="chip-button" onClick={() => go('eligibility')}><BadgeCheck size={14} /> Check eligibility</button>
          </div>
        </section>

        <aside className="ayushman-side">
          <div className="ayushman-links">
            <button className="ayushman-link" onClick={() => go('benefits')}><HeartPulse size={18} /> <div><strong>View benefits</strong><span>Covered services (demo)</span></div> <ArrowRight size={15} /></button>
            <button className="ayushman-link" onClick={() => go('hospitals')}><HospitalIcon size={18} /> <div><strong>Find hospital</strong><span>Empanelled facilities near you</span></div> <ArrowRight size={15} /></button>
            <button className="ayushman-link" onClick={() => go('documents')}><IdCard size={18} /> <div><strong>Documents & card</strong><span>Beneficiary information (demo)</span></div> <ArrowRight size={15} /></button>
            <button className="ayushman-link" onClick={() => go('ayushman-help')}><Info size={18} /> <div><strong>Need help?</strong><span>Simple Ayushman guidance</span></div> <ArrowRight size={15} /></button>
          </div>
          <div className="ayushman-note">
            <Info size={16} />
            <p><strong>Prototype note:</strong> card status shown is demo data, not live government verification. Real products connect to authorized PM-JAY APIs.</p>
          </div>
        </aside>
      </div>
      <section className="ayushman-health-id">
        <div className="ayushman-feature-head">
          <div><span className="status-label"><IdCard size={16} /> HEALTH ID</span><h2>Digital Health ID</h2><p>Use this demo ID to keep your healthcare information connected.</p></div>
          {!ayushmanDemo.healthId && <button className="primary-button" onClick={() => setShowHealthIdForm((open) => !open)}><Plus size={16} /> Create Health ID</button>}
        </div>
        {ayushmanDemo.healthId && (
          <div className="health-id-result">
            <div><small>Demo Health ID</small><strong>{ayushmanDemo.healthId}</strong></div>
            <button className="secondary-button small" onClick={copyHealthId}><Copy size={14} /> Copy Health ID</button>
            <button className="ghost-button small" onClick={() => setShowHealthId(true)}> <Eye size={14} /> View Health ID</button>
          </div>
        )}
        {showHealthIdForm && (
          <form className="ayushman-inline-form" onSubmit={submitHealthId}>
            <label className="field-label" htmlFor="health-id-name">Full name</label><input id="health-id-name" value={healthIdName} onChange={(event) => setHealthIdName(event.target.value)} required />
            <label className="field-label" htmlFor="health-id-mobile">Mobile number</label><input id="health-id-mobile" type="tel" value={healthIdMobile} onChange={(event) => setHealthIdMobile(event.target.value)} minLength={10} required />
            <button className="primary-button" type="submit">Create demo Health ID</button>
            {healthIdError && <p className="form-error" role="alert">{healthIdError}</p>}
          </form>
        )}
        <p className="screen-note">Demo Health ID only. Connect an authorized Health ID API before using this in production.</p>
      </section>
      <section className="ayushman-benefit-summary">
        <div className="ayushman-feature-head">        <div><span className="status-label"><HeartPulse size={16} /> BENEFIT SUMMARY</span><h2>Ayushman benefit balance</h2></div><div className="ayushman-summary-actions"><button className="ayushman-notification-badge" title={`${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`} aria-label={`View ${unreadCount || 0} unread notifications`} onClick={() => go('notifications')}><Bell size={15} />{unreadCount || 0}</button><button className="secondary-button small" onClick={() => { setUsageError(''); setShowUsageForm((open) => !open); }}><Plus size={14} /> Add demo usage</button></div></div>
        <div className="benefit-metrics"><div><small>Total coverage</small><strong>{formatAmount(totalCoverage)}</strong></div><div><small>Amount used</small><strong>{formatAmount(usedAmount)}</strong></div><div><small>Remaining benefit</small><strong>{formatAmount(remainingAmount)}</strong></div><div><small>Services used</small><strong>{ayushmanDemo.usage.length}</strong></div></div>
        <div className="benefit-progress" aria-label={`${usedAmount} of ${totalCoverage} rupees used`}><span style={{ width: `${Math.min((usedAmount / totalCoverage) * 100, 100)}%` }} /></div>
        <div className="benefit-progress-labels"><span>Used {formatAmount(usedAmount)}</span><span>Remaining {formatAmount(remainingAmount)}</span></div>
        {showUsageForm && (
          <form className="ayushman-inline-form usage-form" onSubmit={submitUsage}>
            <label className="field-label" htmlFor="usage-type">Category</label><select id="usage-type" value={usageForm.type} onChange={(event) => setUsageForm({ ...usageForm, type: event.target.value })}><option>Checkups</option><option>Medicines</option><option>Tests</option><option>Hospital Services</option></select>
            <label className="field-label" htmlFor="usage-service">Service name</label><input id="usage-service" value={usageForm.service} onChange={(event) => setUsageForm({ ...usageForm, service: event.target.value })} required />
            {usageForm.type === 'Medicines' && <><label className="field-label" htmlFor="usage-medicine">Medicine name</label><input id="usage-medicine" value={usageForm.medicine} onChange={(event) => setUsageForm({ ...usageForm, medicine: event.target.value })} /></>}
            <label className="field-label" htmlFor="usage-amount">Amount used</label><input id="usage-amount" type="number" min="1" value={usageForm.amount} onChange={(event) => setUsageForm({ ...usageForm, amount: event.target.value })} required />
            <button className="primary-button" type="submit">Record usage</button>
            {usageError && <p className="form-error" role="alert">{usageError}</p>}
          </form>
        )}
      </section>
      <section className="ayushman-usage-section">
        <div className="ayushman-feature-head"><div><span className="status-label"><Clipboard size={16} /> USAGE DETAILS</span><h2>Healthcare usage</h2></div></div>
        <div className="usage-tabs" role="tablist">{['All', 'Checkups', 'Medicines', 'Tests', 'Hospital Services'].map((tab) => <button key={tab} role="tab" aria-selected={filter === tab} className={filter === tab ? 'active' : ''} onClick={() => setFilter(tab)}>{tab}</button>)}</div>
        <div className="usage-list">{visibleUsage.length ? visibleUsage.map((usage) => {
          const remainingAfter = remainingAfterUsage(usage.id);
          return <article className="usage-row" key={usage.id}><div><strong>{usage.service}</strong>{usage.medicine && <span>{usage.medicine}</span>}<small>{usage.hospital} · {usage.date}</small></div><div className="usage-amount"><strong>{formatAmount(usage.amount)}</strong><small>Remaining {formatAmount(Math.max(remainingAfter, 0))}</small></div><button className="ghost-button small" onClick={() => setSelectedUsage({ ...usage, remaining: Math.max(remainingAfter, 0) })}>View details</button></article>;
        }) : <div className="empty-state"><Clipboard size={24} /><strong>No usage records</strong><p>Choose another filter or record a demo healthcare usage transaction.</p></div>}</div>
      </section>
      {showHealthId && <div className="usage-detail-overlay" role="dialog" aria-modal="true" aria-labelledby="health-id-title"><div className="usage-detail-modal"><button className="modal-close" onClick={() => setShowHealthId(false)} aria-label="Close"><X size={18} /></button><span className="status-label"><IdCard size={15} /> DEMO HEALTH ID</span><h2 id="health-id-title">{ayushmanDemo.healthId}</h2><p>This is a demo Health ID and is not connected to an authorized Health ID service.</p><button className="primary-button" onClick={copyHealthId}><Copy size={15} /> Copy Health ID</button></div></div>}
      {selectedUsage && <div className="usage-detail-overlay" role="dialog" aria-modal="true"><div className="usage-detail-modal"><button className="modal-close" onClick={() => setSelectedUsage(null)} aria-label="Close"><X size={18} /></button><span className="status-label">TRANSACTION DETAILS</span><h2>{selectedUsage.service}</h2><p>{selectedUsage.medicine || selectedUsage.hospital}</p><div className="detail-grid"><div><small>Date</small><strong>{selectedUsage.date}</strong></div><div><small>Amount used</small><strong>{formatAmount(selectedUsage.amount)}</strong></div><div><small>Remaining benefit</small><strong>{formatAmount(selectedUsage.remaining)}</strong></div></div></div></div>}
    </>
  );
}

// ── Eligibility check (simulated, honestly labelled) ─────────
export function Eligibility({ go }) {
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | success | error
  const digits = mobile.replace(/\D/g, '');

  const check = (event) => {
    event.preventDefault();
    if (digits.length !== 10) return;
    setState('loading');
    window.setTimeout(() => setState('success'), 1200); // demo verification
  };

  return (
    <>
      <SectionHeading eyebrow="Ayushman" title="Check Ayushman eligibility" copy="Check whether you may be eligible for Ayushman Bharat benefits." />
      <div className="ayushman-layout">
        <section className="eligibility-card">
          {state === 'idle' && (
            <form onSubmit={check}>
              <label className="field-label" htmlFor="el-mobile">Mobile Number</label>
              <div className="mobile-field">
                <span className="prefix">+91</span>
                <input id="el-mobile" type="tel" inputMode="numeric" placeholder="10-digit mobile number"
                  value={mobile} onChange={(e) => { setMobile(e.target.value); }} maxLength={13} />
              </div>
              <label className="field-label" htmlFor="el-dob">Date of Birth</label>
              <input id="el-dob" className="otp-input left" type="text" inputMode="numeric" placeholder="DD / MM / YYYY" value={dob} onChange={(e) => setDob(e.target.value)} />
              <button className="primary-button wide tall" type="submit" disabled={digits.length !== 10}>
                <BadgeCheck size={17} /> Check eligibility
              </button>
              <p className="screen-note">Demo check — no real verification happens. In production this uses an authorized government API.</p>
            </form>
          )}
          {state === 'loading' && (
            <div className="center-state">
              <span className="spinner big" aria-hidden="true" />
              <p>Checking your eligibility…</p>
            </div>
          )}
          {state === 'success' && (
            <div className="center-state">
              <span className="success-mark small"><Check size={24} /></span>
              <h2>You may be eligible for Ayushman Bharat benefits.</h2>
              <p className="heading-copy">Demo result based on sample data — not an official confirmation.</p>
              <div className="eligibility-result-actions">
                <button className="primary-button" onClick={() => go('benefits')}>View details <ArrowRight size={15} /></button>
                <button className="ghost-button" onClick={() => setState('idle')}>Check again</button>
              </div>
            </div>
          )}
          {state === 'error' && (
            <div className="center-state">
              <span className="error-icon">!</span>
              <h2>We couldn't verify your details right now.</h2>
              <p className="heading-copy">Please try again or visit an authorized help desk.</p>
              <button className="secondary-button" onClick={() => setState('idle')}>Try again</button>
            </div>
          )}
        </section>
        <aside className="records-note">
          <BadgeCheck size={22} />
          <h3>How eligibility works</h3>
          <p>Real verification uses SECC 2011 records through official PM-JAY channels. This prototype simulates the step and clearly labels the result as demo.</p>
        </aside>
      </div>
    </>
  );
}

// ── Benefits (no invented coverage amounts) ──────────────────
export function Benefits({ go }) {
  return (
    <>
      <SectionHeading eyebrow="Ayushman" title="Ayushman benefits" copy="An easy overview — official rules would come from verified government sources." />
      <div className="benefits-grid">
        {benefits.map((benefit) => {
          const Icon = benefitIcons[benefit.icon];
          return (
            <section className="benefit-card" key={benefit.id}>
              <span className={`benefit-icon ${benefit.icon}`}><Icon size={20} /></span>
              <h3>{benefit.title}</h3>
              <p>{benefit.copy}</p>
            </section>
          );
        })}
      </div>
      <div className="benefits-footer">
        <p>Do not rely on demo coverage details. The final product will display official scheme information from verified government sources.</p>
        <button className="secondary-button" onClick={() => go('hospitals')}>Find a hospital where you can use it <ArrowRight size={15} /></button>
      </div>
    </>
  );
}

// ── Find hospital ────────────────────────────────────────────
export function Hospitals({ go }) {
  const [query, setQuery] = useState('');
  const filtered = hospitals.filter((h) =>
    (h.name + h.address + h.departments.join(' ')).toLowerCase().includes(query.toLowerCase())
  );
  return (
    <>
      <SectionHeading eyebrow="Ayushman" title="Find an Ayushman hospital" copy="Search demo facilities. Empanelled hospitals are marked." />
      <div className="hospital-search">
        <Search size={18} />
        <input aria-label="Search hospitals by name, area or specialty" placeholder="Search by name, city, district or specialty…"
          value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="hospital-list">
        {filtered.length === 0 && <div className="empty-state"><HospitalIcon size={24} /><strong>No hospitals found</strong><p>Try a different name or specialty.</p></div>}
        {filtered.map((hospital) => (
          <section className="hospital-card" key={hospital.id}>
            <div className="hospital-head">
              <span className="hospital-icon"><HospitalIcon size={20} /></span>
              <div>
                <h3>{hospital.name}</h3>
                <p>{hospital.type} · {hospital.distance}</p>
              </div>
              {hospital.empanelled
                ? <span className="empanel-badge"><Check size={13} /> Empanelled</span>
                : <span className="empanel-badge not">Not empanelled</span>}
            </div>
            <p className="hospital-address"><MapPin size={14} /> {hospital.address}</p>
            <div className="hospital-depts">
              {hospital.departments.map((dept) => <span className="dept-chip" key={dept}>{dept}</span>)}
            </div>
            <div className="hospital-actions">
              <button className="secondary-button small" onClick={() => go('hospital-detail')}><Building2 size={14} /> View hospital</button>
              <button className="ghost-button small" onClick={() => go('tokens')}><Navigation size={14} /> Book token</button>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

// ── Hospital detail ──────────────────────────────────────────
export function HospitalDetail({ go }) {
  const hospital = hospitals[0];
  return (
    <>
      <button className="back-link" onClick={() => go('hospitals')}><ArrowRight size={15} className="flip" /> Back to hospitals</button>
      <SectionHeading eyebrow="Empanelled facility" title={hospital.name} copy={`${hospital.type} · ${hospital.distance} away (demo)`} />
      <div className="ayushman-layout">
        <section className="hospital-detail-card">
          <div className="hospital-head">
            <span className="hospital-icon"><HospitalIcon size={22} /></span>
            <div><h2>{hospital.name}</h2><p>{hospital.empanelled ? '✓ Ayushman empanelled' : 'Not empanelled'} · demo facility</p></div>
          </div>
          <div className="detail-grid">
            <div><small>Address</small><strong>{hospital.address}</strong></div>
            <div><small>Contact</small><strong>{hospital.contact}</strong></div>
            <div><small>Timings</small><strong>{hospital.open}</strong></div>
            <div><small>Departments</small><strong>{hospital.departments.join(', ')}</strong></div>
          </div>
          <p className="choice-caption">Available services</p>
          <div className="hospital-depts">{hospital.services.map((service) => <span className="dept-chip" key={service}>{service}</span>)}</div>
          <div className="hospital-actions big">
            <button className="primary-button" onClick={() => go('tokens')}><CalendarDays size={16} /> Book token</button>
            <button className="secondary-button" onClick={() => go('hospitals')}><Navigation size={15} /> Get directions</button>
            <button className="ghost-button" onClick={() => go('benefits')}><HeartPulse size={15} /> View services</button>
          </div>
        </section>
        <aside className="records-note">
          <ShieldCheck size={22} />
          <h3>Using Ayushman here</h3>
          <p>At an empanelled hospital, eligible beneficiaries can use scheme benefits for covered treatment. Carry your card and ID (demo guidance).</p>
          <button className="text-button" onClick={() => go('ayushman-help')}>Ayushman help & guidance <ArrowRight size={15} /></button>
        </aside>
      </div>
    </>
  );
}

// ── Help & guidance ──────────────────────────────────────────
export function AyushmanHelp({ go }) {
  return (
    <>
      <SectionHeading eyebrow="Support" title="Need help with Ayushman?" copy="Short answers to the most common questions." />
      <div className="help-grid">
        {helpTopics.map((topic) => {
          const Icon = helpIcons[topic.icon];
          return (
            <button className="help-topic-card" key={topic.id} onClick={() => topic.to && go(topic.to)}>
              <span className="help-topic-icon"><Icon size={20} /></span>
              <strong>{topic.title}</strong>
              <p>{topic.copy}</p>
              {topic.to && <ArrowRight size={15} className="topic-arrow" />}
            </button>
          );
        })}
      </div>
      <section className="support-card">
        <Phone size={20} />
        <div>
          <strong>Official support (demo)</strong>
          <p>Call 14555 or visit your nearest Ayushman help desk. The prototype shows contact details as placeholders only.</p>
        </div>
      </section>
    </>
  );
}

// ── Documents ────────────────────────────────────────────────
export function Documents({ go }) {
  return (
    <>
      <SectionHeading eyebrow="Ayushman" title="Documents & card" copy="Everything about your card in one place (demo data)." />
      <div className="help-grid">
        {documents.map((doc) => {
          const Icon = documentIcons[doc.icon];
          return (
            <section className="document-card" key={doc.id}>
              <span className="document-icon"><Icon size={20} /></span>
              <h3>{doc.title}</h3>
              <p>{doc.note}</p>
              <button className="ghost-button small" onClick={() => go(doc.id === 'hospital' ? 'hospitals' : 'ayushman')}>Open <ArrowRight size={14} /></button>
            </section>
          );
        })}
      </div>
      <p className="screen-note">Sensitive details stay hidden in the prototype. The real product would apply secure access controls.</p>
    </>
  );
}
