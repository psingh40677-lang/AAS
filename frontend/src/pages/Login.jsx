import { useState } from 'react';
import { ArrowRight, HeartPulse, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';
import { apiUrl } from '../api';

// Screen 1 — Login. Mock OTP demo authentication (demo OTP: 1234).
export default function Login({ onLogin }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const digits = mobile.replace(/\D/g, '');

  const parseJsonResponse = async (response) => {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { message: text || 'Unexpected response from the server.' };
    }
  };

  const sendOtp = async (event) => {
    event.preventDefault();
    const cleanedMobile = digits;

    if (cleanedMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setError('');
    setBusy(true);

    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: cleanedMobile })
      });
      const body = await parseJsonResponse(response);

      if (!response.ok || body?.success === false) {
        throw new Error(body?.message || 'Unable to send OTP right now. Please try again.');
      }

      setStep(2);
    } catch (requestError) {
      setError(requestError?.message || 'Unable to send OTP right now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    const cleanedOtp = otp.trim();

    if (!cleanedOtp) {
      setError('Please enter the OTP sent to your mobile number.');
      return;
    }

    if (cleanedOtp.length !== 4) {
      setError('OTP must be 4 digits.');
      return;
    }

    if (cleanedOtp !== '1234') {
      setError('Incorrect OTP. For this demo, use 1234.');
      return;
    }

    setError('');
    setBusy(true);

    try {
      const response = await fetch(apiUrl('/api/auth/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: digits, otp: cleanedOtp })
      });
      const body = await parseJsonResponse(response);

      if (!response.ok || body?.success === false) {
        throw new Error(body?.message || 'OTP verification failed. Please try again.');
      }

      onLogin(body && body.data ? body.data.patient : null, body && body.data ? body.data.token : null);
    } catch (requestError) {
      setError(requestError?.message || 'OTP verification failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-language"><LanguageSelector compact /></div>
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark large"><HeartPulse size={26} /></span>
          <h1>AAS</h1>
          <p>Advanced Alied Service</p>
          <span className="login-tagline">Healthcare, made easier for everyone.</span>
        </div>

        {step === 1 ? (
          <form onSubmit={sendOtp} noValidate>
            <label className="field-label" htmlFor="mobile">{t('mobileNumber')}</label>
            <div className="mobile-field">
              <span className="prefix">+91</span>
              <input
                id="mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder={t('mobilePlaceholder')}
                value={mobile}
                onChange={(event) => { setMobile(event.target.value); setError(''); }}
                maxLength={13}
              />
            </div>
            {error && <p className="field-error" role="alert">{error}</p>}
            <p className="field-hint">{t('demoOtpHint')}</p>
            <button className="primary-button wide tall" type="submit" disabled={busy}>
              {busy ? 'Sending OTP…' : <>{t('continue')} <ArrowRight size={17} /></>}
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
              {busy ? 'Verifying…' : <>{t('verifyLogin')} <ArrowRight size={17} /></>}
            </button>
            <button className="ghost-button wide" type="button" onClick={() => { setStep(1); setOtp(''); setError(''); }}>
              {t('changeNumber')}
            </button>
          </form>
        )}

        <p className="login-safety"><ShieldCheck size={14} /> {t('demoSafety')}</p>
      </div>
    </div>
  );
}
