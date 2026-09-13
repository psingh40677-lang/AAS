import { useEffect, useState } from 'react';
import {
  ArrowRight, Bell, CalendarDays, Check, CircleX, Clock3, Radio, RefreshCw, UserRound
} from 'lucide-react';
import { Empty, Loading, SectionHeading } from '../ui';
import { apiUrl } from '../api';
import {
  bookingDates, bookingTimes, departments, deptIcons, doctorAvailability,
  hospitals
} from '../data';

const tokenLabel = (token) => token?.token || (token?.number ? `A-${String(token.number).padStart(3, '0')}` : null);

export function LiveQueueStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionPending, setActionPending] = useState(false);

  const loadStatus = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/queue/status'));
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load queue status.');
      setStatus(result.data);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load queue status.');
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = window.setInterval(() => loadStatus(true), 3000);
    return () => window.clearInterval(interval);
  }, []);

  const updateQueue = async (path) => {
    setActionPending(true);
    try {
      const response = await fetch(apiUrl(path), { method: 'POST' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Queue update failed.');
      setStatus(result.data);
      setError('');
    } catch (actionError) {
      setError(actionError.message || 'Queue update failed.');
    } finally {
      setActionPending(false);
    }
  };

  if (loading) return <section className="live-queue-card"><Loading label="Loading live queue…" compact /></section>;
  if (error && !status) return <section className="live-queue-card"><div className="error-state"><strong>Live queue unavailable.</strong><p>{error}</p><button className="secondary-button" onClick={() => loadStatus()}><RefreshCw size={15} /> Try again</button></div></section>;
  if (!status) return null;

  const queueEmpty = status.queue.length === 0;
  return (
    <section className="live-queue-card" aria-label="Live queue status">
      <div className="live-queue-heading"><div><p className="eyebrow"><Radio size={13} /> LIVE QUEUE STATUS</p><h2>Know your place in line</h2></div><button className="icon-button" onClick={() => loadStatus()} aria-label="Refresh queue status" title="Refresh queue status"><RefreshCw size={16} /></button></div>
      {queueEmpty ? <Empty title="QUEUE IS EMPTY" copy="Newly generated tokens will appear here." /> : <div className="queue-metrics">
        <div className="now-serving-metric"><span>NOW SERVING</span><strong>{tokenLabel(status.nowServing) || 'NO TOKEN CURRENTLY SERVING'}</strong></div>
        <div className="queue-secondary-metrics">
          <div><span>NEXT TOKEN</span><strong>{tokenLabel(status.nextToken) || 'NO NEXT TOKEN'}</strong></div>
          <div><span>WAITING</span><strong>{status.waitingCount}</strong></div>
        </div>
      </div>}
      {error && <p className="live-queue-error" role="alert">{error}</p>}
      <div className="queue-staff-actions">
        <span>Staff controls</span>
        <button className="primary-button" disabled={actionPending || !status.nextToken} onClick={() => updateQueue('/api/queue/next')}><Radio size={16} /> CALL NEXT</button>
        {status.nowServing && <><button className="secondary-button" disabled={actionPending} onClick={() => updateQueue(`/api/queue/${status.nowServing.id}/complete`)}>Complete</button><button className="secondary-button" disabled={actionPending} onClick={() => updateQueue(`/api/queue/${status.nowServing.id}/skip`)}>Skip</button></>}
      </div>
    </section>
  );
}

// Screens 3–4 — token booking (4 steps) and confirmation.
export function TokenBooking({ bookToken, defaultDepartment }) {
  const [step, setStep] = useState(1);
  const [hospitalId, setHospitalId] = useState('district');
  const [department, setDepartment] = useState(defaultDepartment || 'General Medicine');
  const [date, setDate] = useState(bookingDates[0].value);
  const [time, setTime] = useState('10:30 AM');
  const [doctorId, setDoctorId] = useState('');

  const hospital = hospitals.find((h) => h.id === hospitalId);
  const doctors = doctorAvailability[department] || [];
  const availableDoctors = doctors.filter((doctor) => doctor.slots.includes(time));
  const selectedDoctor = availableDoctors.find((doctor) => doctor.id === doctorId) || availableDoctors[0];
  const selectedDate = bookingDates.find((option) => option.value === date) || bookingDates[0];
  return (
    <>
      <LiveQueueStatus />
      <SectionHeading eyebrow="Tokens" title="Book a hospital token" copy="Four short steps — no queue, no paperwork." />
      <div className="steps" aria-label={`Step ${step} of 4`}>
        <span className={step === 1 ? 'active' : ''}>1 Hospital</span><i />
        <span className={step === 2 ? 'active' : ''}>2 Department</span><i />
        <span className={step === 3 ? 'active' : ''}>3 Availability</span><i />
        <span className={step === 4 ? 'active' : ''}>4 Confirm</span>
      </div>

      <section className="booking-card">
        {step === 1 && (
          <>
            <h2>Which hospital?</h2>
            <p className="subcopy">Ayushman-empanelled hospitals are marked with a badge.</p>
            <div className="choice-list">
              {hospitals.map((h) => (
                <button key={h.id} className={hospitalId === h.id ? 'selected' : ''} onClick={() => setHospitalId(h.id)}>
                  <span className="choice-main">
                    <strong>{h.name}</strong>
                    <small>{h.type} · {h.distance}{h.empanelled ? ' · ✓ Empanelled' : ''}</small>
                  </span>
                  {hospitalId === h.id && <Check size={18} />}
                </button>
              ))}
            </div>
            <div className="booking-actions">
              <button className="primary-button" onClick={() => setStep(2)}>Continue <ArrowRight size={17} /></button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Which department do you need?</h2>
            <p className="subcopy">Select one to see available visits at {hospital.name}.</p>
            <div className="department-grid">
              {departments.map(({ name, icon, note }) => {
                const Icon = deptIcons[icon];
                return (
                  <button key={name} className={`selection-card ${department === name ? 'selected' : ''}`} onClick={() => setDepartment(name)}>
                    <span><Icon size={20} /></span>
                    <span className="dept-text"><strong>{name}</strong><small>{note}</small></span>
                    {department === name && <Check size={17} />}
                  </button>
                );
              })}
            </div>
            <div className="booking-actions">
              <button className="secondary-button" onClick={() => setStep(1)}>Back</button>
              <button className="primary-button" onClick={() => setStep(3)}>Continue <ArrowRight size={17} /></button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Check doctor availability</h2>
            <p className="subcopy">Choose a date and time to see which doctors are available for {department}.</p>
            <p className="choice-caption">Date</p>
            <div className="choice-list compact-list">
              {bookingDates.map((option) => (
                <button key={option.value} className={date === option.value ? 'selected' : ''} onClick={() => setDate(option.value)}>
                  <span>{option.label} {option.year}</span>{date === option.value && <Check size={18} />}
                </button>
              ))}
            </div>
            <p className="choice-caption">Time</p>
            <div className="choice-list compact-list">
              {bookingTimes.map((option) => (
                <button key={option} className={time === option ? 'selected' : ''} onClick={() => setTime(option)}>
                  <span>{option}</span>{time === option && <Check size={18} />}
                </button>
              ))}
            </div>
            <p className="choice-caption">Doctors available</p>
            <div className="doctor-availability-list" aria-live="polite">
              {doctors.map((doctor) => {
                const available = doctor.slots.includes(time);
                return (
                  <button
                    key={doctor.id}
                    className={`doctor-availability ${available && selectedDoctor?.id === doctor.id ? 'selected' : ''}`}
                    disabled={!available}
                    onClick={() => setDoctorId(doctor.id)}
                  >
                    <span>
                      <strong>{doctor.name}</strong>
                      <small>{doctor.role}</small>
                      <small>Available: {doctor.slots.join(' · ')}</small>
                    </span>
                    <span className={`availability-status ${available ? 'available' : 'unavailable'}`}>
                      {available ? <><Check size={14} /> Available</> : <><CircleX size={14} /> Unavailable</>}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="booking-actions">
              <button className="secondary-button" onClick={() => setStep(2)}>Back</button>
              <button className="primary-button" disabled={!selectedDoctor} onClick={() => setStep(4)}>Continue <ArrowRight size={17} /></button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2>Confirm your visit</h2>
            <p className="subcopy">Please check the details before booking.</p>
            <div className="confirm-summary">
              <div><span>Hospital</span><strong>{hospital.name}{hospital.empanelled ? ' · ✓ Empanelled' : ''}</strong></div>
              <div><span>Department</span><strong>{department}</strong></div>
              <div><span>Doctor</span><strong>{selectedDoctor?.name || 'No doctor available'}</strong></div>
              <div><span>Date</span><strong>{selectedDate.label} {selectedDate.year}</strong></div>
              <div><span>Time</span><strong>{time}</strong></div>
            </div>
            <div className="booking-actions">
              <button className="secondary-button" onClick={() => setStep(3)}>Back</button>
              <button className="primary-button" onClick={() => bookToken({
                hospital: hospital.name,
                empanelled: hospital.empanelled,
                department, doctor: selectedDoctor.name,
                date: `${selectedDate.label} ${selectedDate.year}`, time, queue: 8
              })}>Confirm token <Check size={17} /></button>
            </div>
          </>
        )}
      </section>
    </>
  );
}

export function TokenConfirmation({ token, go, notify }) {
  if (!token) return <Empty title="No token selected" copy="Book a token to view its confirmation." action={<button className="primary-button" onClick={() => go('tokens')}>Book a token <ArrowRight size={16} /></button>} />;
  const details = token;
  return (
    <div className="confirmation-page">
      <div className="success-mark"><Check size={29} /></div>
      <p className="eyebrow success-eyebrow">🎉 TOKEN CONFIRMED</p>
      <h1>Your visit is booked</h1>
      <p className="heading-copy">Keep this token handy when you arrive.</p>

      <section className="confirmation-card">
        <span className="confirmed-label">{details.department}</span>
        <strong className="big-token">{tokenLabel(details)}</strong>
        <div className="confirmation-details">
          <div><CalendarDays size={17} /><span><small>Date</small><b>{details.date}</b></span></div>
          <div><Clock3 size={17} /><span><small>Time</small><b>{details.time}</b></span></div>
          <div><UserRound size={17} /><span><small>Estimated queue</small><b>{details.queue} people</b></span></div>
        </div>
        <p className="confirmation-hospital">👨‍⚕️ {details.doctor || 'Assigned doctor'} · 🏥 {details.hospital}{details.empanelled ? ' · ✓ Ayushman empanelled' : ''} <span className="demo-chip">DEMO</span></p>
      </section>

      <div className="confirmation-actions">
        <button className="secondary-button" onClick={() => { notify('Reminder added — we will alert you before the visit'); go('notifications'); }}>
          <Bell size={16} /> Add reminder
        </button>
        <button className="primary-button" onClick={() => go('home')}>Back to dashboard <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}
