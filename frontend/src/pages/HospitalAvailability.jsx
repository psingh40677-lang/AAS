import { useMemo, useState } from 'react';
import { Activity, ArrowLeft, CalendarClock, Check, ChevronRight, Droplets, Hospital, MapPin, Phone, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { SectionHeading } from '../ui';
import { hospitalAvailabilitySeed } from '../data';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const filterOptions = ['All Hospitals', 'Beds Available', 'ICU Available', 'Emergency Beds', 'Blood Available'];
const getBedStatus = (hospital) => {
  const ratio = hospital.availableBeds / hospital.totalBeds;
  return ratio > 0.2 ? 'Available' : ratio > 0 ? 'Limited' : 'Full';
};
const getBloodStatus = (units) => units === 0 ? 'Not Available' : units <= 3 ? 'Low' : 'Available';

export default function HospitalAvailability({ notify, pushNotification, go }) {
  const [hospitals, setHospitals] = useState(hospitalAvailabilitySeed);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All Hospitals');
  const [bloodFilter, setBloodFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const refresh = () => {
    setHospitals((current) => {
      const refreshed = current.map((hospital) => {
      const change = Math.floor(Math.random() * 5) - 2;
      const occupiedBeds = Math.max(0, Math.min(hospital.totalBeds, hospital.occupiedBeds + change));
      const blood = Object.fromEntries(Object.entries(hospital.blood).map(([group, units]) => [group, Math.max(0, units + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0))]));
      return { ...hospital, occupiedBeds, blood, lastUpdated: 'just now' };
      });
      setSelected((currentSelected) => currentSelected ? refreshed.find((hospital) => hospital.id === currentSelected.id) || currentSelected : currentSelected);
      return refreshed;
    });
    notify('Hospital availability refreshed');
  };

  const filteredHospitals = useMemo(() => hospitals.filter((hospital) => {
    const matchesQuery = `${hospital.name} ${hospital.location}`.toLowerCase().includes(query.toLowerCase());
    const matchesBlood = !bloodFilter || hospital.blood[bloodFilter] > 0;
    const status = getBedStatus(hospital);
    const matchesFilter = filter === 'All Hospitals'
      || (filter === 'Beds Available' && status !== 'Full')
      || (filter === 'ICU Available' && hospital.icuBeds > 0)
      || (filter === 'Emergency Beds' && hospital.emergencyBeds > 0)
      || (filter === 'Blood Available' && Object.values(hospital.blood).some((units) => units > 0));
    return matchesQuery && matchesBlood && matchesFilter;
  }), [hospitals, query, filter, bloodFilter]);

  if (selected) return (
    <HospitalDetails hospital={selected} onBack={() => setSelected(null)} onRefresh={refresh} notify={notify} pushNotification={pushNotification} />
  );

  return (
    <>
      <SectionHeading eyebrow="Demo availability data" title="Hospital Availability" copy="Check beds and blood inventory before visiting a hospital." action={<div className="availability-heading-actions"><button className="secondary-button" onClick={() => go('bed-availability')}><Hospital size={15} /> Bed Availability</button><button className="primary-button" onClick={refresh}><RefreshCw size={16} /> Refresh availability</button></div>} />
      <div className="availability-note"><ShieldAlert size={17} /><span>This is demo availability data. It is not connected to a live hospital-management system.</span></div>
      <div className="availability-toolbar">
        <label className="availability-search"><Search size={17} /><input aria-label="Search hospital or location" placeholder="Search hospital or location…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <select aria-label="Filter hospitals" value={filter} onChange={(event) => setFilter(event.target.value)}>{filterOptions.map((option) => <option key={option}>{option}</option>)}</select>
        <select aria-label="Filter by blood group" value={bloodFilter} onChange={(event) => setBloodFilter(event.target.value)}><option value="">All blood groups</option>{bloodGroups.map((group) => <option key={group}>{group}</option>)}</select>
      </div>
      <div className="availability-section-title"><h2><Hospital size={20} /> Bed Availability</h2><span>{filteredHospitals.length} hospitals</span></div>
      <section className="hospital-availability-grid">
        {filteredHospitals.map((hospital) => <HospitalCard key={hospital.id} hospital={hospital} onClick={() => setSelected(hospital)} />)}
      </section>
      {!filteredHospitals.length && <div className="empty-state"><Hospital size={24} /><strong>No hospitals found</strong><p>Try a different search or filter.</p></div>}
      <div className="availability-section-title blood-title"><h2><Droplets size={20} /> Blood Availability</h2><span>Units available by hospital</span></div>
      <section className="blood-availability-grid">
        {filteredHospitals.map((hospital) => <BloodCard key={hospital.id} hospital={hospital} onClick={() => setSelected(hospital)} />)}
      </section>
    </>
  );
}

function HospitalCard({ hospital, onClick }) {
  const availableBeds = hospital.totalBeds - hospital.occupiedBeds;
  const status = getBedStatus({ ...hospital, availableBeds });
  return <button className="hospital-availability-card" onClick={onClick}>
    <div className="availability-card-head"><span className="hospital-icon"><Hospital size={21} /></span><span className={`availability-badge ${status.toLowerCase()}`}>{status}</span></div>
    <h3>{hospital.name}</h3><p><MapPin size={14} /> {hospital.location}</p>
    <div className="bed-metrics"><div><small>Total beds</small><strong>{hospital.totalBeds}</strong></div><div><small>Occupied</small><strong>{hospital.occupiedBeds}</strong></div><div><small>Available</small><strong>{availableBeds}</strong></div></div>
    <div className="availability-bars"><span style={{ width: `${(availableBeds / hospital.totalBeds) * 100}%` }} /></div>
    <div className="hospital-extra"><span>ICU <b>{hospital.icuBeds}</b></span><span>Emergency <b>{hospital.emergencyBeds}</b></span><small><CalendarClock size={13} /> {hospital.lastUpdated}</small></div>
    <ChevronRight size={17} className="availability-arrow" />
  </button>;
}

function BloodCard({ hospital, onClick }) {
  return <button className="blood-hospital-card" onClick={onClick}><div className="availability-card-head"><h3>{hospital.name}</h3><ChevronRight size={17} /></div><div className="blood-grid">{bloodGroups.map((group) => { const units = hospital.blood[group]; const status = getBloodStatus(units); return <div className="blood-cell" key={group}><strong>{group}</strong><span>{units} units</span><small className={status.toLowerCase().replace(' ', '-')}>{status}</small></div>; })}</div></button>;
}

function HospitalDetails({ hospital, onBack, onRefresh, notify, pushNotification }) {
  const availableBeds = hospital.totalBeds - hospital.occupiedBeds;
  const notifyAvailability = (message) => {
    notify(message);
    pushNotification({ kind: 'Hospital availability', icon: 'hospital', title: 'Availability update', body: message });
  };
  return <><button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Back to availability</button><SectionHeading eyebrow="Demo availability data" title={hospital.name} copy={`${hospital.location} · Last updated ${hospital.lastUpdated}`} action={<button className="primary-button" onClick={onRefresh}><RefreshCw size={16} /> Refresh availability</button>} /><div className="hospital-detail-availability"><section className="hospital-detail-panel"><div className="availability-card-head"><span className="hospital-icon"><Hospital size={21} /></span><span className={`availability-badge ${getBedStatus({ ...hospital, availableBeds }).toLowerCase()}`}>{getBedStatus({ ...hospital, availableBeds })}</span></div><div className="bed-metrics detail-metrics"><div><small>Total beds</small><strong>{hospital.totalBeds}</strong></div><div><small>Occupied</small><strong>{hospital.occupiedBeds}</strong></div><div><small>Available</small><strong>{availableBeds}</strong></div><div><small>ICU available</small><strong>{hospital.icuBeds}</strong></div><div><small>Emergency beds</small><strong>{hospital.emergencyBeds}</strong></div></div><h3>Blood inventory</h3><div className="blood-grid">{bloodGroups.map((group) => { const units = hospital.blood[group]; const status = getBloodStatus(units); return <div className="blood-cell" key={group}><strong>{group}</strong><span>{units} units</span><small className={status.toLowerCase().replace(' ', '-')}>{status}</small></div>; })}</div></section><aside className="hospital-contact-panel"><MapPin size={21} /><h3>Hospital contact</h3><p>{hospital.address}</p><p><Phone size={14} /> {hospital.contact}</p><button className="primary-button wide" onClick={() => notifyAvailability(`Directions opened for ${hospital.name} in demo mode`)}><MapPin size={15} /> Get directions</button><button className="secondary-button wide" onClick={() => notifyAvailability(`${hospital.name} contact details are ${hospital.contact}`)}><Phone size={15} /> Contact hospital</button></aside></div></>;
}
