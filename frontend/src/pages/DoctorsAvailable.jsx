import { ArrowRight, CalendarDays, Check, Clock3, DoorOpen, Stethoscope, UserRound } from 'lucide-react';
import { SectionHeading } from '../ui';
import { doctorsAvailable } from '../data';

export default function DoctorsAvailable({ onBookDoctor }) {
  return (
    <>
      <SectionHeading
        eyebrow="Care team"
        title="Doctors available"
        copy="Find the right doctor and check today's consultation timings."
      />

      <div className="doctors-summary" role="status">
        <span className="doctors-summary-icon"><Stethoscope size={20} /></span>
        <div>
          <strong>{doctorsAvailable.filter((doctor) => doctor.status === 'Available').length} doctors available now</strong>
          <span>Availability may change during consultation hours.</span>
        </div>
        <span className="doctors-summary-date"><CalendarDays size={15} /> Today</span>
      </div>

      <section className="doctors-grid" aria-label="Doctors available">
        {doctorsAvailable.map((doctor) => (
          <article className="doctor-card" key={doctor.id}>
            <div className="doctor-card-header">
              <span className="doctor-avatar"><UserRound size={20} /></span>
              <span className={`doctor-status ${doctor.status.toLowerCase()}`}>
                {doctor.status === 'Available' && <Check size={13} />}
                {doctor.status}
              </span>
            </div>
            <h2>{doctor.name}</h2>
            <p className="doctor-specialization">{doctor.specialization}</p>
            <dl className="doctor-details">
              <div><dt>Sector</dt><dd>{doctor.sector}</dd></div>
              <div><dt>Master qualification</dt><dd>{doctor.master}</dd></div>
              <div><dt>Experience</dt><dd>{doctor.experience}</dd></div>
              <div><dt>Working since</dt><dd>{doctor.workingYear}</dd></div>
              <div><dt>Department</dt><dd>{doctor.department}</dd></div>
              <div><dt><DoorOpen size={14} /> Room</dt><dd>{doctor.room}</dd></div>
              <div><dt><Clock3 size={14} /> Consultation timings</dt><dd>{doctor.timings}</dd></div>
            </dl>
            <button
              className="primary-button doctor-book-button"
              disabled={doctor.status !== 'Available'}
              onClick={() => onBookDoctor(doctor)}
            >
              Book token <ArrowRight size={15} />
            </button>
          </article>
        ))}
      </section>
    </>
  );
}
