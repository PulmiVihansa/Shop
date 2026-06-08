import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';
import { getPasswordChecks, getPasswordStrength, isStrongPassword } from '../utils/passwordValidation.js';
import '../styles/auth-streetwear.css';

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const googleAuthUrl = `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')}/auth/google`;
  const passwordChecks = useMemo(() => getPasswordChecks(form.password), [form.password]);
  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);
  const passwordsMatch = Boolean(form.confirmPassword) && form.password === form.confirmPassword;
  const canSubmit = isStrongPassword(form.password) && passwordsMatch && acceptedTerms && !submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!isStrongPassword(form.password)) {
      setError('Password does not meet security requirements');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the Terms & Conditions');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: form.fullName.trim(),
        email: form.email,
        password: form.password,
      });
      navigate('/login', {
        replace: true,
        state: { message: 'Account created successfully. Please sign in.' },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = () => {
    setError('');
    window.location.assign(googleAuthUrl);
  };

  return (
    <section className="astravia-auth-page">
      <div className="auth-image-panel">
        <img src="/models/signup_img.png" alt="Astravia signup campaign" className="auth-side-image" />
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <p className="auth-kicker">Join The Movement</p>
          <h2>Sign Up To Astravia</h2>
          {error && <div className="auth-error">{error}</div>}

          <form className="street-auth-form" onSubmit={handleSubmit}>
            <label>
              Full Name
              <input
                type="text"
                value={form.fullName}
                autoComplete="name"
                required
                onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                autoComplete="email"
                required
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label>
              Password
              <span className="auth-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  autoComplete="new-password"
                  required
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>
            <div className="password-live-panel" aria-live="polite">
              <div className={`password-strength strength-${passwordStrength.toLowerCase()}`}>
                <span>Password strength</span>
                <strong>{passwordStrength}</strong>
              </div>
              <ul className="password-requirements">
                {passwordChecks.map((requirement) => (
                  <li key={requirement.key} className={requirement.met ? 'met' : 'missing'}>
                    <span aria-hidden="true">{requirement.met ? '✓' : '×'}</span>
                    {requirement.label}
                  </li>
                ))}
              </ul>
            </div>
            <label>
              Confirm Password
              <span className="auth-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  autoComplete="new-password"
                  required
                  onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>
            {form.confirmPassword && !passwordsMatch && <div className="auth-inline-error">Passwords do not match.</div>}

            <label className="auth-check auth-terms">
              <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
              <span aria-hidden="true" />
              Terms & Conditions
            </label>

            <button className="auth-primary-btn" type="submit" disabled={!canSubmit}>
              {submitting ? 'Creating...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>
          <button className="auth-google-btn" type="button" onClick={handleGoogleAuth}>
            <svg className="google-logo" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.5c-.2 1.2-.9 2.3-2 3v2.4h3.2c1.9-1.7 3.1-4.2 3.1-7.1z" />
              <path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.7-2.6l-3.2-2.4c-.9.6-2 1-3.5 1-2.7 0-4.9-1.8-5.7-4.2H3v2.5C4.7 19.7 8.1 22 12 22z" />
              <path fill="#FBBC05" d="M6.3 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.7H3C2.4 9 2 10.5 2 12s.4 3 1 4.3l3.3-2.5z" />
              <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 3 14.7 2 12 2 8.1 2 4.7 4.3 3 7.7l3.3 2.5C7.1 7.8 9.3 6 12 6z" />
            </svg>
            Continue with Google
          </button>
          <div className="auth-switch-link">
            <span>Already have an account?</span>
            <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
