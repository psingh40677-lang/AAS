import { useRef, useState } from 'react';
import { ArrowRight, Bot, ShieldCheck } from 'lucide-react';
import { SectionHeading } from '../ui';
import { patient } from '../data';

const SUGGESTIONS = [
  'Mera next follow-up kab hai?',
  'Is my Ayushman Card active?',
  'Find an Ayushman hospital',
  'Where can I find my reports?',
  'How do I book a token?',
  'Remind me about my medicine'
];

// Very small local intent engine — mirrors the backend /api/ai/ask demo.
function answerFor(text) {
  const q = text.toLowerCase();
  const has = (...words) => words.some((w) => q.includes(w));

  // Safety: emergencies first.
  if (has('emergency', 'chest pain', 'bleeding', 'unconscious', 'saans', 'heart attack')) {
    return {
      text: 'If you believe this is an emergency, please seek immediate medical care right away. You can go to the nearest hospital emergency department.',
      intent: 'emergency', action: null
    };
  }
  // Safety: refuse diagnosis / prescriptions.
  if (has('diagnose', 'what disease', 'do i have', 'interpret my report', 'what medicine should i take', 'dose', 'dosage', 'kitni goli')) {
    return {
      text: "I can't diagnose a medical condition or suggest medicines. I can help you find the right healthcare service or department.",
      intent: 'out_of_scope', action: { label: 'Find a department', page: 'tokens' }
    };
  }
  // Ayushman intents.
  if (has('ayushman', 'pmjay', 'pm-jay', 'card active', 'aayush', 'आयुष्मान')) {
    if (has('hospital', 'empanel')) return { text: 'I can help you find an empanelled hospital near you. Here are the demo facilities.', intent: 'navigation', action: { label: 'Find hospital', page: 'hospitals' } };
    if (has('benefit', 'coverage', 'kya milega')) return { text: 'You can see an easy overview of Ayushman benefits — hospitalization, treatment, diagnostics and more (demo information).', intent: 'navigation', action: { label: 'View benefits', page: 'benefits' } };
    if (has('eligible', 'verify', 'check')) return { text: 'I can take you to the eligibility check. Remember: the prototype result is a demo, not official verification.', intent: 'navigation', action: { label: 'Check eligibility', page: 'eligibility' } };
    return { text: 'Your Ayushman Card status is Active (demo status). You can view the card details or find an empanelled hospital.', intent: 'information', action: { label: 'View card', page: 'ayushman' } };
  }
  // Appointments & follow-ups.
  if (has('follow', 'appointment', 'next visit', 'token #', 'kab hai', 'milna')) {
    return { text: 'Your next follow-up is on 15 September at General Medicine, District Hospital.', intent: 'appointment_information', action: { label: 'View token', page: 'confirmation' } };
  }
  // Records & reports.
  if (has('report', 'record', 'document', 'file', 'kagaz')) {
    return { text: 'You can find your reports in Health Records — consultations, your CBC report and prescription are all in one timeline.', intent: 'navigation', action: { label: 'Open records', page: 'records' } };
  }
  // Booking.
  if (has('token', 'book', 'queue', 'line')) {
    return { text: 'You can book a hospital token in four short steps — hospital, department, date and time. Your next token number will be #27 (demo).', intent: 'navigation', action: { label: 'Book token', page: 'tokens' } };
  }
  // Medicines & reminders.
  if (has('medicine', 'tablet', 'dawa', 'reminder', 'dose time')) {
    return { text: 'Your medicines are in the Medicines section with morning, afternoon and night reminders. Medicine C is due at 8:00 PM today.', intent: 'navigation', action: { label: 'Open medicines', page: 'medicines' } };
  }
  // Department guidance.
  if (has('which department', 'kis department', 'where should i go', 'doctor kaun')) {
    return { text: 'For everyday health concerns, General Medicine is a good start. For heart, bone or eye issues, choose Cardiology, Orthopedics or Ophthalmology while booking.', intent: 'information', action: { label: 'Book token', page: 'tokens' } };
  }
  return {
    text: `I can help you with tokens, records, medicines, reminders and Ayushman services, ${patient.firstName}. Try one of the suggestions below.`,
    intent: 'fallback', action: null
  };
}

// Screen 9 — Ask AAS: healthcare navigation assistant (not a doctor).
export default function AskAAS({ go }) {
  const [messages, setMessages] = useState([
    { from: 'aas', text: `Namaste ${patient.firstName}! How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef(null);

  const scrollDown = () => window.setTimeout(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, 30);

  const send = (raw) => {
    const text = (typeof raw === 'string' ? raw : input).trim();
    if (!text || thinking) return;
    setInput('');
    setMessages((current) => [...current, { from: 'user', text }]);
    setThinking(true);
    scrollDown();

    // Ask the backend (which runs the same demo intent logic server-side),
    // but fall back to the local engine if the API is unreachable.
    fetch('/api/ai/ask', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
      .then((r) => r.json())
      .then((body) => (body && body.success ? body.data : Promise.reject()))
      .then((data) => setMessages((current) => [...current, { from: 'aas', text: data.message || data.text, action: data.action }]))
      .catch(() => setMessages((current) => [...current, { from: 'aas', ...answerFor(text) }]))
      .finally(() => { setThinking(false); scrollDown(); });
  };

  return (
    <>
      <SectionHeading eyebrow="Your healthcare guide" title="Ask AAS" copy="Simple help for navigating your care." />
      <div className="ai-layout">
        <section className="chat-card">
          <div className="chat-head">
            <span className="ai-avatar"><Bot size={20} /></span>
            <div><strong>AAS assistant</strong><span>Here to help with healthcare navigation</span></div>
            <span className="online-dot" aria-label="Online" />
          </div>

          <div className="messages" ref={listRef} aria-live="polite">
            {messages.map((message, index) => (
              <div className={`message ${message.from}`} key={`${index}-${message.text.slice(0, 12)}`}>
                <span>{message.text}</span>
                {message.from === 'aas' && message.action && (
                  <button className="message-action" onClick={() => go(message.action.page)}>
                    {message.action.label} <ArrowRight size={14} />
                  </button>
                )}
              </div>
            ))}
            {thinking && (
              <div className="message aas thinking"><span className="dots"><i /><i /><i /></span></div>
            )}
          </div>

          <div className="suggestions">
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} onClick={() => send(suggestion)}>{suggestion}</button>
            ))}
          </div>

          <form className="chat-input" onSubmit={(event) => { event.preventDefault(); send(); }}>
            <input aria-label="Ask AAS a question" value={input} placeholder="Type your question…"
              onChange={(event) => setInput(event.target.value)} />
            <button aria-label="Send question" type="submit" disabled={thinking}><ArrowRight size={18} /></button>
          </form>
        </section>

        <aside className="ai-safety">
          <ShieldCheck size={21} />
          <h3>Designed to guide, not diagnose</h3>
          <p>AAS helps you navigate hospital services, appointments, records, medicines and Ayushman steps. It does not diagnose conditions or prescribe medicines.</p>
          <div className="urgent">
            <strong>Need urgent medical help?</strong>
            <span>If you believe this is an emergency, please seek immediate medical care.</span>
          </div>
        </aside>
      </div>
    </>
  );
}
