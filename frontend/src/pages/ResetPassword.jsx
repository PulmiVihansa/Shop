import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api.js';
import { useToast } from '../components/ToastProvider.jsx';
import { getPasswordChecks, getPasswordStrength, isStrongPassword } from '../utils/passwordValidation.js';
import '../styles/auth-streetwear.css';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [validating, setValidating] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const passwordChecks = useMemo(() => getPasswordChecks(form.password), [form.password]);
  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);
  const passwordsMatch = Boolean(form.confirmPassword) && form.password === form.confirmPassword;
  const canSubmit = validToken && isStrongPassword(form.password) && passwordsMatch && !submitting;

  useEffect(() => {
    let active = true;

    async function validateToken() {
      setValidating(true);
      setError('');
      try {
        await api.get(`/auth/reset-password/${encodeURIComponent(token || '')}`);
        if (active) setValidToken(true);
      } catch (err) {
        if (active) {
          setValidToken(false);
          setError(getErrorMessage(err) || 'This reset link has expired.');
        }
      } finally {
        if (active) setValidating(false);
      }
    }

    validateToken();
    return () => {
      active = false;
    };
  }, [token]);

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

    setSubmitting(true);
    try {
      await api.post(`/auth/reset-password/${encodeURIComponent(token || '')}`, {
        password: form.password,
      });
      toast.success('Password updated successfully.');
      navigate('/login', {
        replace: true,
        state: { message: 'Password updated successfully.' },
      });
    } catch (err) {
      const errorMessage = getErrorMessage(err) || 'Something went wrong.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="astravia-auth-page">
      <div className="auth-image-panel">
        <img src="/models/signup_img.png" alt="Astravia reset password campaign" className="auth-side-image" />
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <p className="auth-kicker">Secure Reset</p>
          <h2>Reset Password</h2>
          {validating && <div className="auth-message">Validating reset link...</div>}
          {error && <div className="auth-error">{error}</div>}

          {!validating && !validToken && (
            <div className="auth-switch-link">
              <span>This reset link has expired.</span>
              <Link to="/forgot-password">Request a new link</Link>
            </div>
          )}

          {!validating && validToken && (
            <form className="street-auth-form" onSubmit={handleSubmit}>
              <label>
                New Password
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

              <button className="auth-primary-btn" type="submit" disabled={!canSubmit}>
                {submitting ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
