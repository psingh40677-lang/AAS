import { useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, DoorOpen, UserRound, X } from 'lucide-react';
import { SectionHeading } from '../ui';
import { bookingDates } from '../data';

export function DoctorAppointmentBooking({ doctor, go, onConfirm }) {
  const [date] = useState(bookingDates[0]);
  const [time, setTime] = useState(doctor.slots[0]);

  return (
    <>
      <SectionHeading
        eyebrow="Doctor appointment"
        title="Book your token"
        copy="Choose an available consultation time for your doctor."
        action={<button className="secondary-button" onClick={() => go('doctors')}><ArrowLeft size={15} /> Back</button>}
      />
      <section className="appointment-doctor-card">
        <span className="doctor-avatar"><UserRound size={20} /></span>
        <div><h2>{doctor.name}</h2><p>{doctor.specialization} · {doctor.department}</p></div>
        <span className="doctor-status available"><Check size={13} /> Available</span>
      </section>
      <section className="appointment-card">
        <p className="choice-caption">Appointment date</p>
        <div className="appointment-date"><CalendarDays size={17} /><strong>{date.label} {date.year}</strong><span>Today only</span></div>
        <p className="choice-caption">Available consultation time</p>
        <div className="appointment-slots" role="group" aria-label="Available consultation times">
          {doctor.slots.map((slot) => (
            <button key={slot} className={time === slot ? 'selected' : ''} onClick={() => setTime(slot)}>
              <Clock3 size={16} /> {slot}{time === slot && <Check size={16} />}
            </button>
          ))}
        </div>
        <div className="appointment-actions">
          <button className="secondary-button" onClick={() => go('doctors')}>Back to doctors</button>
          <button className="primary-button" onClick={() => onConfirm({ doctor, date: `${date.label} ${date.year}`, time })}>Confirm booking <Check size={16} /></button>
        </div>
      </section>
    </>
  );
}

export function DoctorAppointmentConfirmation({ appointment, go, onCancel }) {
  if (!appointment) return null;
  return (
    <div className="confirmation-page">
      <div className="success-mark"><Check size={29} /></div>
      <p className="eyebrow success-eyebrow">TOKEN CONFIRMED</p>
      <h1>Your appointment is booked</h1>
      <p className="heading-copy">Keep this digital token handy for your visit.</p>
      <section className="confirmation-card appointment-confirmation-card">
        <span className="confirmed-label">{appointment.doctor.department}</span>
        <strong className="big-token">#{appointment.tokenNumber}</strong>
        <div className="confirmation-details">
          <div><UserRound size={17} /><span><small>Doctor</small><b>{appointment.doctor.name}</b></span></div>
          <div><DoorOpen size={17} /><span><small>Room</small><b>{appointment.doctor.room}</b></span></div>
          <div><CalendarDays size={17} /><span><small>Date</small><b>{appointment.date}</b></span></div>
          <div><Clock3 size={17} /><span><small>Appointment time</small><b>{appointment.time}</b></span></div>
          <div><UserRound size={17} /><span><small>Queue position</small><b>{appointment.queuePosition}</b></span></div>
        </div>
        <p className="confirmation-status"><Check size={15} /> {appointment.status}</p>
      </section>
      <div className="confirmation-actions">
        <button className="secondary-button" onClick={() => go('doctor-confirmation')}><TicketIcon /> View token</button>
        <button className="secondary-button danger-button" onClick={onCancel}><X size={16} /> Cancel appointment</button>
        <button className="primary-button" onClick={() => go('doctors')}>Back to doctors <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}

function TicketIcon() {
  return <span aria-hidden="true">#</span>;
}
