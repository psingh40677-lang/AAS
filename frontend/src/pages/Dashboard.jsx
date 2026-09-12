import {
  Activity, ArrowRight, Bell, CalendarDays, Check, ChevronRight, Clock3,
  IdCard, MessageCircle, Pill, Ticket, ClipboardList, Stethoscope
} from 'lucide-react';
import { SectionHeading } from '../ui';
import { adherenceFor, patient, records, recordIcons, slotIcons } from '../data';


// Screen 2 — Dashboard: today's health, Ayushman card, quick actions, reminders.
export default function Dashboard({ go, token, medicines, markTaken, ayushman, unreadCount }) {
  const next = token || {
    department: 'General Medicine', number: 27,
    date: '10 September 2026', time: '10:30 AM', queue: 8, hospital: 'District Hospital'
  };
  const nextMedicine = medicines.find((m) => m.status === 'pending');
  const adherence = adherenceFor(medicines);
  const SlotIcon = nextMedicine ? (slotIcons[nextMedicine.icon] || Pill) : Pill;

  return (
    <>
      <SectionHeading
        eyebrow="Wednesday, 09 September 2026"
        title={`Namaste, ${patient.firstName} 👋`}
        copy="Here's your health information for today."
        action={<button className="help-link" onClick={() => go('ask')}><MessageCircle size={16} /> Ask AAS</button>}
      />

      <div className="dashboard-grid">
        <section className="token-hero">
          <div className="card-topline">
            <span className="status-label"><span className="status-dot" /> NEXT VISIT</span>
            <button className="round-arrow" onClick={() => go('tokens')} aria-label="Open tokens"><ArrowRight size={17} /></button>
          </div>
          <div className="token-content">
            <div>
              <h2>{next.department}</h2>
              <p><CalendarDays size={16} /> {next.date} <span>·</span> <Clock3 size={16} /> {next.time}</p>
              <p className="hero-hospital">{next.hospital || 'District Hospital'} (demo)</p>
            </div>
            <div className="token-number"><span>Token</span><strong>#{next.number}</strong></div>
          </div>
          <div className="token-footer">
            <span><strong>{next.queue}</strong> people estimated ahead</span>
            <button className="text-button" onClick={() => go('confirmation')}>View token <ArrowRight size={15} /></button>
          </div>
        </section>

        <section className="ayushman-strip" onClick={() => go('ayushman')} role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') go('ayushman'); }}
          aria-label="Open Ayushman card">
          <div className="ayushman-strip-left">
            <span className="ayushman-strip-icon"><IdCard size={20} /></span>
            <div>
              <strong>Ayushman Bharat <span className="demo-chip">DEMO</span></strong>
              <span className={`status-inline ${ayushman.status}`}>
                {ayushman.status === 'active' ? '✓ Card Active' : ayushman.status === 'pending' ? '● Verification Pending' : '! Check status'}
              </span>
            </div>
          </div>
          <div className="ayushman-strip-actions">
            <button className="chip-button" onClick={(e) => { e.stopPropagation(); go('ayushman'); }}>View card</button>
            <button className="chip-button ghost" onClick={(e) => { e.stopPropagation(); go('benefits'); }}>Benefits</button>
          </div>
        </section>

        <section className="quick-actions">
          <div className="card-topline"><h3>Quick actions</h3><span className="muted-label">MOST USED</span></div>
          <div className="quick-grid">
            <QuickAction icon={Ticket} label="Book token" color="blue" onClick={() => go('tokens')} />
            <QuickAction icon={IdCard} label="Ayushman" color="saffron" onClick={() => go('ayushman')} />
            <QuickAction icon={ClipboardList} label="My records" color="mint" onClick={() => go('records')} />
            <QuickAction icon={Pill} label="Medicines" color="yellow" onClick={() => go('medicines')} />
            <QuickAction icon={MessageCircle} label="Ask AAS" color="coral" onClick={() => go('ask')} />
            <QuickAction icon={Bell} label={`Alerts${unreadCount ? ` (${unreadCount})` : ''}`} color="slate" onClick={() => go('notifications')} />
          </div>
        </section>

        <section className="medicine-reminder">
          <div className="card-topline">
            <span className="status-label"><Clock3 size={16} /> MEDICINE REMINDER</span>
            <button className="text-button" onClick={() => go('medicines')}>See all <ArrowRight size={15} /></button>
          </div>
          {nextMedicine ? (
            <div className="reminder-row">
              <div className="medicine-icon"><SlotIcon size={20} /></div>
              <div>
                <h3>{nextMedicine.name}</h3>
                <p>{nextMedicine.time} · {nextMedicine.instruction}</p>
              </div>
              <button className="primary-button compact" onClick={() => markTaken(nextMedicine.id)}>Mark taken <Check size={15} /></button>
            </div>
          ) : (
            <div className="completed-state"><Check size={19} /> All medicines taken for today. Great job!</div>
          )}
        </section>

        <section className="follow-up-card" onClick={() => go('records')} role="button" tabIndex={0} aria-label="Follow-up details">
          <div className="follow-icon"><Stethoscope size={19} /></div>
          <div>
            <span className="eyebrow">FOLLOW-UP</span>
            <h3>Due in 5 days</h3>
            <p>General Medicine · 15 September (demo)</p>
          </div>
          <ChevronRight size={18} className="follow-chevron" />
        </section>
      </div>

      <div className="lower-grid">
        <section className="mini-records">
          <div className="card-topline">
            <h3>Recent records</h3>
            <button className="text-button" onClick={() => go('records')}>View all <ArrowRight size={15} /></button>
          </div>
          {records.slice(0, 3).map((record) => {
            const Icon = recordIcons[record.icon];
            return (
              <button className="record-row" key={record.id} onClick={() => go(record.id === 3 ? 'prescription' : 'records')}>
                <span className="record-icon"><Icon size={17} /></span>
                <span className="record-text"><strong>{record.title}</strong><span>{record.type}</span></span>
                <time>{record.date.replace(' 2026', '')}</time>
              </button>
            );
          })}
        </section>
        <section className="adherence-card">
          <div className="card-topline"><h3>Medicine adherence</h3><span className="trend"><Activity size={14} /> this week</span></div>
          <div className="adherence-number">{adherence}<span>%</span></div>
          <p>{adherence >= 80 ? 'Great progress! Keep following your schedule.' : 'Every dose counts — you can catch up today.'}</p>
          <div className="progress"><span style={{ width: `${adherence}%` }} /></div>
          <div className="days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
        </section>
      </div>
    </>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }) {
  return (
    <button className="quick-action" onClick={onClick}>
      <span className={`quick-icon ${color}`}><Icon size={19} /></span>
      <span className="quick-label">{label}</span>
      <ArrowRight size={14} />
    </button>
  );
}
