import { useState } from 'react';
import { ArrowRight, Check, ChevronRight, FileText, Pill, ReceiptText, Stethoscope } from 'lucide-react';
import { SectionHeading } from '../ui';
import { adherenceFor, prescription, recordIcons, records, slotIcons } from '../data';

// Screens 5–6 — health records timeline and prescription viewer.
export function Records({ go }) {
  const [openId, setOpenId] = useState(null);
  return (
    <>
      <SectionHeading eyebrow="Your health" title="Health records" copy="A simple timeline of your care. Tap a record to see details."
        action={<button className="filter-button"><Stethoscope size={16} /> All time</button>} />
      <div className="records-layout">
        <section className="timeline-card">
          {records.map((record) => {
            const Icon = recordIcons[record.icon];
            const open = openId === record.id;
            return (
              <div key={record.id}>
                <button className="timeline-item" onClick={() => setOpenId(open ? null : record.id)} aria-expanded={open}>
                  <span className="timeline-date">{record.date.replace(' 2026', '')}</span>
                  <span className="timeline-line"><span className="timeline-dot"><Icon size={15} /></span></span>
                  <span className="timeline-body"><strong>{record.title}</strong><span>{record.type}</span></span>
                  <ChevronRight size={17} className={open ? 'rotated' : ''} />
                </button>
                {open && (
                  <div className="record-detail">
                    <p>{record.detail}</p>
                    {record.id === 3 && <button className="text-button" onClick={() => go('prescription')}>View prescription <ArrowRight size={15} /></button>}
                  </div>
                )}
              </div>
            );
          })}
        </section>
        <aside className="records-note">
          <FileText size={22} />
          <h3>Your records, together</h3>
          <p>Reports, visits and prescriptions stay in one easy-to-find place — no more searching for old files.</p>
          <button className="text-button" onClick={() => go('consent')}>Learn about your data <ArrowRight size={15} /></button>
        </aside>
      </div>
    </>
  );
}

export function Prescription({ go, addedToMedicines, addMedicines }) {
  const SlotIcon = slotIcons.sun;
  return (
    <>
      <SectionHeading eyebrow="From your records" title="Prescription" copy="Medicines prescribed at your last visit." />
      <div className="records-layout">
        <section className="prescription-card">
          <div className="prescription-head">
            <div>
              <span className="eyebrow">PRESCRIPTION</span>
              <h2>{prescription.department}</h2>
              <p>{prescription.date} · {prescription.doctor}</p>
            </div>
            <span className="rx-badge"><Pill size={18} /></span>
          </div>
          <div className="rx-list">
            {prescription.medicines.map((medicine) => {
              const Icon = slotIcons[{ Morning: 'sun', Afternoon: 'afternoon', Night: 'night' }[medicine.time]] || Pill;
              return (
                <div className="rx-row" key={medicine.id}>
                  <span className={`time-icon ${medicine.time.toLowerCase()}`}><Icon size={18} /></span>
                  <div><strong>{medicine.name}</strong><span>{medicine.time} · {medicine.instruction}</span></div>
                  {addedToMedicines && <span className="taken-badge"><Check size={13} /> In schedule</span>}
                </div>
              );
            })}
          </div>
          {addedToMedicines
            ? <button className="secondary-button wide" onClick={() => go('medicines')}>Open my medicine schedule <ArrowRight size={16} /></button>
            : <button className="primary-button wide tall" onClick={() => { addMedicines(); go('medicines'); }}>
                Add to Medicines <Check size={17} />
              </button>}
          <p className="rx-note">Reminders will appear under Medicines. AAS never changes a prescription — always follow your doctor's advice.</p>
        </section>
        <aside className="records-note">
          <SlotIcon size={22} />
          <h3>One tap to remember</h3>
          <p>Adding this prescription creates morning, afternoon and night reminders, so no dose is missed.</p>
          <button className="text-button" onClick={() => go('ask')}>Ask AAS about medicines <ArrowRight size={15} /></button>
        </aside>
      </div>
    </>
  );
}

export function Medicines({ medicines, markTaken, go }) {
  const adherence = adherenceFor(medicines);
  const takenCount = medicines.filter((m) => m.status === 'taken').length;
  return (
    <>
      <SectionHeading eyebrow="Your routine" title="Today's medicines" copy="A gentle reminder for each part of your day."
        action={<button className="filter-button"><Pill size={16} /> Today</button>} />
      <div className="medicine-layout">
        <section className="medicine-list">
          <button className="primary-button pharmacy-order-button" onClick={() => go('pharmacy-order')}><ReceiptText size={17} /> Place Order with Prescription</button>
          {medicines.map((medicine) => {
            const Icon = slotIcons[medicine.icon] || Pill;
            return (
              <div className={`medicine-card ${medicine.status}`} key={medicine.id}>
                <span className={`time-icon ${medicine.icon}`}><Icon size={19} /></span>
                <div className="medicine-info">
                  <span className="medicine-time">{medicine.time}</span>
                  <h3>{medicine.name}</h3>
                  <p>{medicine.instruction}</p>
                </div>
                {medicine.status === 'taken'
                  ? <span className="taken-badge"><Check size={14} /> Taken</span>
                  : <button className="secondary-button small" onClick={() => markTaken(medicine.id)}>Mark taken</button>}
              </div>
            );
          })}
          <p className="medicine-summary">{takenCount} of {medicines.length} doses taken today.</p>
          <button className="text-button" onClick={() => go('prescription')}>View prescription <ArrowRight size={15} /></button>
        </section>
        <aside className="adherence-side">
          <div className="card-topline"><h3>Weekly adherence</h3><Pill size={17} /></div>
          <div className="adherence-number">{adherence}<span>%</span></div>
          <p>You're building a healthy rhythm.</p>
          <div className="progress"><span style={{ width: `${adherence}%` }} /></div>
          <div className="adherence-caption"><span>{takenCount} of {medicines.length} doses on track</span><span>Keep going</span></div>
        </aside>
      </div>
    </>
  );
}
