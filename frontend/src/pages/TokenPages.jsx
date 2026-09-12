import { useState } from 'react';
import {
  ArrowRight, Bell, CalendarDays, Check, CircleX, Clock3, UserRound
} from 'lucide-react';
import { SectionHeading } from '../ui';
import {
  bookingDates, bookingTimes, departments, deptIcons, doctorAvailability,
  hospitals, tokensIssuedToday
} from '../data';

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
  const nextNumber = tokensIssuedToday + 1;

  return (
    <>
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
                department, doctor: selectedDoctor.name, number: nextNumber,
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
  const details = token || {
    hospital: 'District Hospital', department: 'General Medicine', number: 27,
    date: `${bookingDates[0].label} ${bookingDates[0].year}`, time: '10:30 AM', queue: 8, empanelled: true
  };
  return (
    <div className="confirmation-page">
      <div className="success-mark"><Check size={29} /></div>
      <p className="eyebrow success-eyebrow">🎉 TOKEN CONFIRMED</p>
      <h1>Your visit is booked</h1>
      <p className="heading-copy">Keep this token handy when you arrive.</p>

      <section className="confirmation-card">
        <span className="confirmed-label">{details.department}</span>
        <strong className="big-token">#{details.number}</strong>
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
