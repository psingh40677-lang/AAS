import { useState } from 'react';
import { ArrowRight, HeartPulse, ShieldCheck } from 'lucide-react';

// Screen 1 — Login. Mock OTP demo authentication (demo OTP: 1234).
export default function Login({ onLogin }) {
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const digits = mobile.replace(/\D/g, '');

  const sendOtp = (event) => {
    event.preventDefault();
    if (digits.length !== 10) { setError('Please enter a valid 10-digit mobile number.'); return; }
    setError('');
    setBusy(true);
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: digits })
    })
      .then(() => { setBusy(false); setStep(2); })
      .catch(() => { setBusy(false); setStep(2); });
  };

  const verifyOtp = (event) => {
    event.preventDefault();
    if (otp.trim() !== '1234') { setError('Incorrect OTP. For this demo, use 1234.'); return; }
    setError('');
    setBusy(true);
    fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: digits, otp })
    })
      .then((response) => response.json())
      .then((body) => { setBusy(false); onLogin(body && body.data ? body.data.patient : null); })
      .catch(() => { setBusy(false); onLogin(null); });
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark large"><HeartPulse size={26} /></span>
          <h1>AAS</h1>
          <p>Advanced Alied Service</p>
          <span className="login-tagline">Healthcare, made easier for everyone.</span>
        </div>

        {step === 1 ? (
          <form onSubmit={sendOtp} noValidate>
            <label className="field-label" htmlFor="mobile">Mobile Number</label>
            <div className="mobile-field">
              <span className="prefix">+91</span>
              <input
                id="mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(event) => { setMobile(event.target.value); setError(''); }}
                maxLength={13}
              />
            </div>
            {error && <p className="field-error" role="alert">{error}</p>}
            <p className="field-hint">We'll send a demo OTP to this number.</p>
            <button className="primary-button wide tall" type="submit" disabled={busy}>
              {busy ? 'Sending OTP…' : <>Continue <ArrowRight size={17} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} noValidate>
            <label className="field-label" htmlFor="otp">Enter OTP</label>
            <input
              id="otp"
              className="otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="• • • •"
              value={otp}
              onChange={(event) => { setOtp(event.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
              maxLength={4}
            />
            {error && <p className="field-error" role="alert">{error}</p>}
            <p className="field-hint">Demo OTP is <strong>1234</strong> — no SMS is sent.</p>
            <button className="primary-button wide tall" type="submit" disabled={busy}>
              {busy ? 'Verifying…' : <>Verify & Login <ArrowRight size={17} /></>}
            </button>
            <button className="ghost-button wide" type="button" onClick={() => { setStep(1); setOtp(''); setError(''); }}>
              Change number
            </button>
          </form>
        )}

        <p className="login-safety"><ShieldCheck size={14} /> Demo prototype · fictional data only</p>
      </div>
    </div>
  );
}
