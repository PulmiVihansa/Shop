import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';
import '../styles/auth-streetwear.css';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleAuthUrl = `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')}/auth/google`;
  const signupMessage = location.state?.message;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(form);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
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
        <img src="/models/login_img.png" alt="Astravia login campaign" className="auth-side-image" />
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <p className="auth-kicker">Welcome Back</p>
          <h2>Login To Astravia</h2>
          {signupMessage && <div className="auth-message">{signupMessage}</div>}
          {error && <div className="auth-error">{error}</div>}

          <form className="street-auth-form" onSubmit={handleSubmit}>
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
                  autoComplete="current-password"
                  required
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>

            <div className="auth-row">
              <label className="auth-check">
                <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                <span aria-hidden="true" />
                Remember me
              </label>
              <a href="/forgot-password">Forgot password?</a>
            </div>

            <button className="auth-primary-btn" type="submit" disabled={submitting}>
              {submitting ? 'Logging In...' : 'Login'}
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
            <span>Don't have an account?</span>
            <Link to="/signup">Sign Up</Link>
          </div>
          <p className="auth-security">Secure encrypted login. Your account and order history stay private.</p>
        </div>
      </div>
    </section>
  );
}
