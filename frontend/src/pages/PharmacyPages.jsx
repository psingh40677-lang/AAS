import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Check, ChevronRight, ClipboardCheck, FileText, ImagePlus, Package,
  Phone, Plus, RefreshCw, ShieldCheck, Trash2, Upload, X
} from 'lucide-react';
import { SectionHeading } from '../ui';
import { apiUrl } from '../api';

const statusSteps = ['Prescription Uploaded', 'Under Verification', 'Approved', 'Preparing', 'Ready for Pickup/Out for Delivery', 'Delivered'];
const acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
const priceFor = (medicine) => Math.max(Number(medicine.quantity) || 0, 0) * 50;

const defaultMedicine = () => ({ name: '', strength: '', quantity: 1, instructions: '' });

export function PharmacyOrder({ patient, sessionToken, go, onOrderCreated }) {
  const [form, setForm] = useState({
    patientName: patient?.name || '', age: patient?.age || '', mobile: patient?.mobile || '', address: patient?.address || '', notes: '', fulfillment: 'delivery', prescription: null, medicines: [defaultMedicine()]
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const total = useMemo(() => form.medicines.reduce((sum, item) => sum + priceFor(item), 0), [form.medicines]);

  const update = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setError(''); };
  const updateMedicine = (index, field, value) => setForm((current) => ({ ...current, medicines: current.medicines.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));

  const readPrescription = (file) => {
    if (!file) return;
    if (!acceptedTypes.includes(file.type)) { setError('Upload a JPG, PNG or PDF prescription.'); return; }
    if (file.size > 6 * 1024 * 1024) { setError('Prescription files must be 6 MB or smaller.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setForm((current) => ({ ...current, prescription: { name: file.name, type: file.type, size: file.size, data: reader.result } })); setError(''); };
    reader.onerror = () => setError('We could not read that prescription. Please try again.');
    reader.readAsDataURL(file);
  };

  const validate = () => {
    if (!form.patientName.trim() || !form.age || !form.mobile.trim() || form.address.trim().length < 5) return 'Complete the patient and delivery details.';
    if (!/^\+?[\d\s-]{10,16}$/.test(form.mobile)) return 'Enter a valid mobile number.';
    if (!form.prescription) return 'Upload the prescription before continuing.';
    if (!form.medicines.some((item) => item.name.trim())) return 'Add at least one medicine or write the medicine name from the prescription.';
    if (form.medicines.some((item) => item.name.trim() && Number(item.quantity) < 1)) return 'Medicine quantities must be at least 1.';
    return '';
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    setError('');
    try {
      const response = await fetch(apiUrl('/api/pharmacy/orders'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: { name: form.patientName.trim(), age: Number(form.age), mobile: form.mobile.trim(), address: form.address.trim() },
          prescription: form.prescription,
          medicines: form.medicines.filter((item) => item.name.trim()),
          notes: form.notes.trim(), fulfillment: form.fulfillment, estimatedPrice: total, totalAmount: total
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to place pharmacy order.');
      onOrderCreated(result.data);
      go('pharmacy-status');
    } catch (requestError) {
      setError(requestError.message || 'Unable to place pharmacy order.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionHeading eyebrow="Pharmacy" title="Place order with prescription" copy="Send your prescription securely for pharmacist verification." action={<button className="secondary-button" type="button" onClick={() => go('medicines')}><ArrowLeft size={15} /> Medicines</button>} />
      <form className="pharmacy-order-layout" onSubmit={placeOrder}>
        <div className="pharmacy-order-main">
          <section className="pharmacy-card">
            <PharmacySectionHeading icon={Upload} title="Upload prescription" />
            <p className="pharmacy-help">A pharmacist must verify every prescription before medicines are approved or fulfilled.</p>
            {!form.prescription ? <div className="prescription-upload-zone"><ImagePlus size={27} /><strong>Upload Prescription</strong><span>JPG, PNG or PDF up to 6 MB</span><div className="upload-actions"><label className="primary-button small"><Upload size={15} /> Upload file<input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(event) => readPrescription(event.target.files?.[0])} hidden /></label><label className="secondary-button small"><ImagePlus size={15} /> Take a photo<input type="file" accept="image/*" capture="environment" onChange={(event) => readPrescription(event.target.files?.[0])} hidden /></label></div></div> : <PrescriptionPreview prescription={form.prescription} onReplace={() => setForm((current) => ({ ...current, prescription: null }))} />}
          </section>

          <section className="pharmacy-card">
            <PharmacySectionHeading icon={ClipboardCheck} title="Patient details" />
            <div className="pharmacy-fields"><PharmacyField label="Patient Name"><input value={form.patientName} onChange={(event) => update('patientName', event.target.value)} required /></PharmacyField><PharmacyField label="Patient Age"><input type="number" min="0" max="120" value={form.age} onChange={(event) => update('age', event.target.value)} required /></PharmacyField><PharmacyField label="Mobile Number"><input type="tel" value={form.mobile} onChange={(event) => update('mobile', event.target.value)} required /></PharmacyField><PharmacyField label="Delivery Address" wide><textarea rows="3" value={form.address} onChange={(event) => update('address', event.target.value)} required /></PharmacyField></div>
          </section>

          <section className="pharmacy-card">
            <div className="pharmacy-section-title-row"><PharmacySectionHeading icon={Package} title="Medicine details" /><button className="secondary-button small" type="button" onClick={() => update('medicines', [...form.medicines, defaultMedicine()])}><Plus size={15} /> Add medicine</button></div>
            <p className="pharmacy-help">List what you need if it is readable on the prescription. The pharmacist will confirm availability, strength and dosage.</p>
            <div className="medicine-order-list">{form.medicines.map((medicine, index) => <div className="medicine-order-row" key={index}><PharmacyField label="Medicine name"><input value={medicine.name} onChange={(event) => updateMedicine(index, 'name', event.target.value)} placeholder="e.g. Medicine A" /></PharmacyField><PharmacyField label="Strength / dosage"><input value={medicine.strength} onChange={(event) => updateMedicine(index, 'strength', event.target.value)} placeholder="e.g. 500 mg" /></PharmacyField><PharmacyField label="Quantity"><input type="number" min="1" value={medicine.quantity} onChange={(event) => updateMedicine(index, 'quantity', event.target.value)} /></PharmacyField><PharmacyField label="Doctor's instructions"><input value={medicine.instructions} onChange={(event) => updateMedicine(index, 'instructions', event.target.value)} placeholder="Optional" /></PharmacyField>{form.medicines.length > 1 && <button className="icon-button pharmacy-remove" type="button" onClick={() => update('medicines', form.medicines.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove medicine"><Trash2 size={16} /></button>}</div>)}</div>
          </section>

          <section className="pharmacy-card"><PharmacySectionHeading icon={FileText} title="Delivery and notes" /><div className="fulfillment-options"><label className={form.fulfillment === 'delivery' ? 'selected' : ''}><input type="radio" name="fulfillment" checked={form.fulfillment === 'delivery'} onChange={() => update('fulfillment', 'delivery')} /><strong>Home delivery</strong><span>Delivered to your address</span></label><label className={form.fulfillment === 'pickup' ? 'selected' : ''}><input type="radio" name="fulfillment" checked={form.fulfillment === 'pickup'} onChange={() => update('fulfillment', 'pickup')} /><strong>Pickup at pharmacy</strong><span>Collect when ready</span></label></div><PharmacyField label="Optional notes for pharmacist" wide><textarea rows="3" value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Any helpful information or clarification request" /></PharmacyField></section>
        </div>
        <aside className="pharmacy-order-summary pharmacy-card"><PharmacySectionHeading icon={ClipboardCheck} title="Order summary" /><div className="summary-lines"><SummaryLine label="Patient" value={form.patientName || 'Not entered'} /><SummaryLine label="Prescription" value={form.prescription?.name || 'Not uploaded'} /><SummaryLine label="Medicines" value={`${form.medicines.filter((item) => item.name.trim()).length} item(s)`} /><SummaryLine label="Delivery" value={form.fulfillment === 'delivery' ? 'Home delivery' : 'Pharmacy pickup'} /><SummaryLine label="Address" value={form.address || 'Not entered'} /></div><div className="summary-total"><span>Estimated total</span><strong>₹{total.toLocaleString('en-IN')}</strong></div><p className="pharmacy-safety"><ShieldCheck size={16} /> Prescription medicines are never automatically dispensed. A pharmacist must verify the prescription first.</p>{error && <p className="pharmacy-form-error" role="alert">{error}</p>}<button className="primary-button wide tall" type="submit" disabled={saving}>{saving ? 'Submitting…' : <>Place Order <Check size={17} /></>}</button></aside>
      </form>
    </>
  );
}

export function PharmacyOrderConfirmation({ order, go, sessionToken }) {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [error, setError] = useState('');
  const refresh = async () => { if (!currentOrder?.id) return; const response = await fetch(apiUrl(`/api/pharmacy/orders/${currentOrder.id}`), { headers: { Authorization: `Bearer ${sessionToken}` } }); const result = await response.json(); if (result.success) setCurrentOrder(result.data); };
  const viewPrescription = async () => { const response = await fetch(apiUrl(`/api/pharmacy/orders/${currentOrder.id}/prescription`), { headers: { Authorization: `Bearer ${sessionToken}` } }); const result = await response.json(); if (!response.ok || !result.success) { setError(result.message || 'Unable to open prescription.'); return; } window.open(result.data.data, '_blank', 'noopener,noreferrer'); };
  useEffect(() => { const interval = window.setInterval(refresh, 5000); return () => window.clearInterval(interval); }, [currentOrder?.id]);
  if (!currentOrder) return <div className="empty-state"><strong>No pharmacy order selected.</strong><button className="primary-button" onClick={() => go('pharmacy-order')}>Place an order</button></div>;
  const currentStep = statusSteps.findIndex((status) => currentOrder.status.startsWith(status.split('/')[0]));
  const rejected = currentOrder.status === 'Prescription Verification Failed';
  return <><SectionHeading eyebrow="Pharmacy" title={rejected ? 'Prescription verification failed' : 'Prescription received ✓'} copy={rejected ? currentOrder.rejectionReason : 'Your order is safely with the pharmacy team.'} action={<button className="secondary-button" onClick={() => go('medicines')}><ArrowLeft size={15} /> Medicines</button>} /><section className="pharmacy-status-card"><div className="order-id-line"><span>Order ID</span><strong>#{currentOrder.id}</strong><button className="icon-button" onClick={() => refresh()} aria-label="Refresh order status" title="Refresh order status"><RefreshCw size={16} /></button></div><div className={`order-status-banner ${rejected ? 'rejected' : ''}`}><ShieldCheck size={21} /><div><strong>{currentOrder.status}</strong><span>{rejected ? currentOrder.rejectionReason : 'Pharmacist verification is required before fulfillment.'}</span></div></div>{!rejected && <div className="order-progress">{statusSteps.map((status, index) => <div className={`${index <= currentStep ? 'complete' : ''} ${index === currentStep ? 'current' : ''}`} key={status}><span>{index < currentStep ? <Check size={13} /> : index + 1}</span><small>{status}</small></div>)}</div>}<div className="confirmation-order-details"><SummaryLine label="Prescription" value={currentOrder.prescription.name} /><SummaryLine label="Medicines" value={currentOrder.medicines.map((item) => `${item.name} ×${item.quantity}`).join(', ')} /><SummaryLine label="Total amount" value={`₹${Number(currentOrder.totalAmount).toLocaleString('en-IN')}`} /></div>{error && <p className="pharmacy-form-error" role="alert">{error}</p>}<div className="confirmation-actions"><button className="primary-button" onClick={() => rejected ? go('pharmacy-order') : refresh()}>{rejected ? 'Upload new prescription' : 'Track order'} <ArrowRight size={16} /></button><button className="secondary-button" onClick={viewPrescription}><FileText size={15} /> View prescription</button><button className="secondary-button" onClick={() => go('pharmacy-staff')}>Pharmacy staff view</button></div></section></>;
}

export function PharmacyStaff({ sessionToken, go }) {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { const response = await fetch(apiUrl('/api/pharmacy/staff/orders'), { headers: { Authorization: `Bearer ${sessionToken}`, 'X-AAS-Staff': 'demo-pharmacy-staff' } }); const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load pharmacy orders.'); setOrders(result.data); setSelected((current) => current ? result.data.find((order) => order.id === current.id) || current : result.data[0]); setError(''); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const updateStatus = async (status, reason = '', medicines = selected?.medicines) => { const response = await fetch(apiUrl(`/api/pharmacy/staff/orders/${selected.id}`), { method: 'PUT', headers: { Authorization: `Bearer ${sessionToken}`, 'X-AAS-Staff': 'demo-pharmacy-staff', 'Content-Type': 'application/json' }, body: JSON.stringify({ status, reason, medicines }) }); const result = await response.json(); if (!response.ok || !result.success) { setError(result.message || 'Unable to update order.'); return; } setSelected(result.data); setOrders((current) => current.map((order) => order.id === result.data.id ? result.data : order)); };
  if (loading) return <div className="loading"><span className="spinner" /><span>Loading pharmacy orders…</span></div>;
  if (error && !orders.length) return <div className="error-state"><strong>Pharmacy console unavailable.</strong><p>{error}</p><button className="secondary-button" onClick={load}><RefreshCw size={15} /> Try again</button></div>;
  const editAvailability = (index, availability) => setSelected((current) => ({ ...current, medicines: current.medicines.map((item, itemIndex) => itemIndex === index ? { ...item, availability } : item) }));
  return <><SectionHeading eyebrow="Authorized staff" title="Pharmacy verification" copy="Review prescriptions before approving fulfillment." action={<button className="secondary-button" onClick={() => go('medicines')}><ArrowLeft size={15} /> Patient medicines</button>} /><div className="pharmacy-staff-layout"><section className="pharmacy-card staff-order-list"><div className="card-topline"><h3>Orders</h3><button className="icon-button" onClick={load} aria-label="Refresh pharmacy orders"><RefreshCw size={16} /></button></div>{orders.length === 0 ? <div className="empty-state"><Package size={25} /><strong>No orders yet</strong><p>New prescription orders will appear here.</p></div> : orders.map((order) => <button className={`staff-order-row ${selected?.id === order.id ? 'selected' : ''}`} key={order.id} onClick={() => setSelected(order)}><span><strong>#{order.id}</strong><small>{order.patient.name} · {order.prescription.name}</small></span><em>{order.status}</em><ChevronRight size={15} /></button>)}</section>{selected && <section className="pharmacy-card staff-order-detail"><div className="order-id-line"><span>Order #{selected.id}</span><span className="demo-chip">STAFF ONLY</span></div><div className="staff-prescription-preview"><FileText size={25} /><div><strong>{selected.prescription.name}</strong><span>{selected.prescription.type} · protected preview</span></div><button className="secondary-button small" onClick={async () => { const response = await fetch(apiUrl(`/api/pharmacy/orders/${selected.id}/prescription`), { headers: { Authorization: `Bearer ${sessionToken}`, 'X-AAS-Staff': 'demo-pharmacy-staff' } }); const result = await response.json(); if (result.success) window.open(result.data.data, '_blank', 'noopener,noreferrer'); }}>View prescription</button></div><div className="confirmation-order-details"><SummaryLine label="Patient" value={`${selected.patient.name}, age ${selected.patient.age}`} /><SummaryLine label="Mobile" value={selected.patient.mobile} /><SummaryLine label="Address" value={selected.patient.address} /></div><div className="staff-medicine-list"><strong>Medicine availability</strong>{selected.medicines.map((item, index) => <div className="staff-medicine-row" key={index}><span>{item.name} ×{item.quantity}</span><input value={item.availability || ''} onChange={(event) => editAvailability(index, event.target.value)} placeholder="Available / Substitute / Unavailable" /></div>)}<button className="secondary-button small" onClick={() => updateStatus(selected.status === 'Under Verification' ? 'Approved' : selected.status, '', selected.medicines)}><Check size={15} /> Save availability</button></div><div className="staff-actions"><button className="primary-button" disabled={selected.status !== 'Under Verification'} onClick={() => updateStatus('Approved')}><Check size={15} /> Approve</button><button className="secondary-button" disabled={selected.status !== 'Under Verification'} onClick={() => updateStatus('Prescription Verification Failed', 'The prescription needs clarification. Please contact the pharmacy.')}>Reject</button><a className="secondary-button" href={`tel:${selected.patient.mobile}`}><Phone size={15} /> Contact patient</a><select value={statusSteps.includes(selected.status) ? selected.status : ''} onChange={(event) => event.target.value && updateStatus(event.target.value)}><option value="">Update order status</option>{['Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered'].map((status) => <option key={status}>{status}</option>)}</select></div></section>}</div></>;
}

function PharmacySectionHeading({ icon: Icon, title }) { return <div className="pharmacy-section-heading"><span><Icon size={17} /></span><h2>{title}</h2></div>; }
function PharmacyField({ label, wide, children }) { return <label className={`pharmacy-field ${wide ? 'wide' : ''}`}><span>{label}</span>{children}</label>; }
function PrescriptionPreview({ prescription, onReplace }) { return <div className="prescription-preview">{prescription.type.startsWith('image/') ? <img src={prescription.data} alt="Prescription preview" /> : <span className="pdf-preview"><FileText size={29} /><strong>PDF prescription</strong></span>}<div><strong>{prescription.name}</strong><span>{Math.ceil(prescription.size / 1024)} KB · ready to submit</span></div><button className="secondary-button small" type="button" onClick={onReplace}><X size={15} /> Replace</button></div>; }
function SummaryLine({ label, value }) { return <div className="summary-line"><span>{label}</span><strong>{value}</strong></div>; }
