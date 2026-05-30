import { useState } from 'react';
import Header from '../components/Header.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const googleAuthUrl = `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')}/auth/google`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
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
        state: {
          message: 'Account created successfully. Please sign in.'
        }
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
    <>
      <Header />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Archivo:wght@300;400;600&display=swap');

        :root {
          --cream: #faf7f2;
          --charcoal: #1a1a1a;
          --Ash: #8f9390;
          --sage: #a8b5a0;
          --stone: #d4cdc5;
        }

        
        .auth-page {
          padding: 8rem 1.5rem 4rem;
        }

        .auth-shell {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(340px, 1fr) minmax(280px, 0.85fr);
          background: #fff;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(26, 26, 26, 0.18);
          border: 1px solid rgba(26, 26, 26, 0.08);
          min-height: 560px;
        }

        .form-panel {
          padding: 3rem 3.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 1.45rem;
          background: #ffffff;
        }

        .auth-badge {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          padding: 0.45rem 0.8rem;
          border-radius: 999px;
          border: 1px solid rgba(26, 26, 26, 0.08);
          background: rgba(250, 247, 242, 0.92);
          color: rgba(26, 26, 26, 0.72);
          font-size: 0.66rem;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
        }

        .form-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.3rem;
          font-weight: 400;
          letter-spacing: 0.08em;
          margin: 0.4rem 0 0.3rem;
        }

        .form-subtitle {
          color: rgba(26, 26, 26, 0.6);
          font-size: 0.95rem;
          line-height: 1.7;
          margin: 0;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
          max-width: none;
          align-self: stretch;
        }

        .auth-form label {
          display: block;
          margin-bottom: 0.4rem;
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(30, 26, 23, 0.58);
        }

        .auth-form input {
          width: 100%;
          height: 56px;
          padding: 0 1rem;
          border: 1px solid #d8cfc2;
          border-radius: 16px;
          background: #f7f3ee;
          color: #1e1a17;
          font-size: 0.95rem;
          box-sizing: border-box;
          transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease, background 0.25s ease;
        }

        .auth-form input::placeholder {
          color: rgba(30, 26, 23, 0.48);
        }

        .auth-form input:focus {
          outline: none;
          border-color: #b89a7a;
          background: #fbf8f4;
          box-shadow: 0 0 0 4px rgba(184, 154, 122, 0.12);
        }

        .password-field {
          position: relative;
        }

        .password-field input {
          padding-right: 3rem;
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          cursor: pointer;
          color: rgba(26, 26, 26, 0.6);
          font-size: 1rem;
          padding: 0;
        }

        .toggle-password:hover {
          color: var(--charcoal);
        }

        .primary-btn {
          width: 100%;
          min-height: 56px;
          box-sizing: border-box;
          padding: 0.95rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: var(--charcoal);
          color: var(--cream);
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 0.78rem;
          cursor: pointer;
          border-radius: 999px;
          box-shadow: 0 14px 26px rgba(26, 26, 26, 0.14);
          transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
          margin-top: 0.4rem;
        }

        .primary-btn:hover {
          background: #121212;
          transform: translateY(-1px);
          box-shadow: 0 18px 32px rgba(26, 26, 26, 0.18);
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: rgba(26, 26, 26, 0.45);
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          margin: 0.4rem 0 0.1rem;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(26, 26, 26, 0.09);
        }

        .divider span {
          white-space: nowrap;
        }

        .google-btn {
          width: 100%;
          min-height: 56px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          box-sizing: border-box;
          padding: 0.95rem 1rem;
          border: 1px solid #d8cfc2;
          background: #ffffff;
          color: var(--charcoal);
          text-decoration: none;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          cursor: pointer;
          border-radius: 999px;
          box-shadow: 0 10px 22px rgba(26, 26, 26, 0.06);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          align-self: stretch;
        }

        .google-btn:hover {
          transform: translateY(-1px);
          border-color: #cdb9a6;
          box-shadow: 0 14px 26px rgba(26, 26, 26, 0.08);
        }

        .google-btn svg {
          flex: 0 0 auto;
        }

        .auth-switch {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          flex-wrap: wrap;
          color: rgba(26, 26, 26, 0.62);
          font-size: 0.92rem;
          margin-top: 0.2rem;
        }

        .auth-switch a {
          color: var(--charcoal);
          font-weight: 600;
          text-decoration: none;
        }

        .auth-switch a:hover {
          color: var(--Ash);
        }

        .brand-panel {
          position: relative;
          padding: 3.75rem 3.5rem;
          background: var(--charcoal);
          color: var(--cream);
          display: flex;
          flex-direction: column;
          gap: 2rem;
          justify-content: space-between;
          border-left: 1px solid rgba(250, 247, 242, 0.08);
        }

        .brand-panel::before {
          content: '';
          position: absolute;
          top: 2.5rem;
          right: 0;
          width: 4px;
          height: 120px;
          background: var(--Ash);
        }

        .brand-panel::after {
          content: 'ATELIER';
          position: absolute;
          left: -20px;
          bottom: 30px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 6rem;
          font-weight: 300;
          letter-spacing: 0.3em;
          color: rgba(250, 247, 242, 0.05);
          pointer-events: none;
          white-space: nowrap;
        }

        .brand-kicker {
          font-size: 0.72rem;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: var(--Ash);
          font-weight: 600;
        }

        .brand-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.4rem;
          font-weight: 300;
          line-height: 1.1;
          letter-spacing: -0.01em;
          margin: 0.5rem 0 1rem;
        }

        .brand-copy {
          font-size: 0.95rem;
          line-height: 1.7;
          color: rgba(250, 247, 242, 0.7);
        }

        .brand-highlights {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          font-size: 0.72rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(250, 247, 242, 0.55);
        }

        @media (max-width: 960px) {
          .auth-shell {
            grid-template-columns: 1fr;
          }

          .form-panel {
            padding: 3rem 2.5rem 3.5rem;
          }

          .brand-panel {
            padding: 3rem 2.5rem;
            border-left: none;
            border-top: 1px solid rgba(26, 26, 26, 0.08);
          }
        }

        @media (max-width: 640px) {
          .auth-page {
            padding: 7.5rem 1rem 3rem;
          }

          .row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="auth-page">
        <div className="auth-shell">
          <div className="form-panel">
            <div className="auth-badge">SECURE SIGN UP</div>
            <div>
              <h2 className="form-title">Create your account</h2>
              <p className="form-subtitle">Join Atelier to unlock curated edits and private releases.</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                type="text"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              />

              <label htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                type="email"
                placeholder="you@atelier.com"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />

              <label htmlFor="signup-password">Password</label>
              <div className="password-field">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  👁
                </button>
              </div>

              <label htmlFor="signup-confirm-password">Confirm Password</label>
              <div className="password-field">
                <input
                  id="signup-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  👁
                </button>
              </div>

              {error && <p className="form-subtitle" style={{ color: 'var(--Ash)', marginBottom: 0 }}>{error}</p>}
              <button className="primary-btn" type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create account'}
              </button>
            </form>

            <div className="divider"><span>Or continue with</span></div>
            <button type="button" className="google-btn" onClick={handleGoogleAuth}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.24 3.62l6.9-6.9C35.96 2.73 30.47 0 24 0 14.62 0 6.54 5.38 2.6 13.22l8.03 6.24C12.5 13.44 17.72 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24.5c0-1.56-.14-3.07-.41-4.5H24v8.5h12.7c-.55 3-2.24 5.55-4.78 7.27l7.43 5.77C43.84 37.1 46.5 31.34 46.5 24.5z" />
                <path fill="#FBBC05" d="M10.63 28.96A14.4 14.4 0 019.5 24c0-1.72.31-3.37.88-4.96l-8.03-6.24A24 24 0 000 24c0 3.85.92 7.48 2.55 10.69l8.08-5.73z" />
                <path fill="#34A853" d="M24 48c6.47 0 11.9-2.13 15.87-5.77l-7.43-5.77c-2.07 1.39-4.73 2.21-8.44 2.21-6.28 0-11.5-3.94-13.37-9.44l-8.08 5.73C6.5 42.62 14.62 48 24 48z" />
              </svg>
              Continue with Google
            </button>
            <div className="auth-switch">
              <span>Already have an account?</span>
              <Link to="/login">Sign In</Link>
            </div>
          </div>

          <aside className="brand-panel">
            <div>
              <div className="brand-kicker">ATELIER</div>
              <h1 className="brand-title">A wardrobe curated for quiet confidence.</h1>
              <p className="brand-copy">
                Members receive early access to capsule releases, atelier appointments, and tailored fit guidance.
              </p>
            </div>
            <div className="brand-highlights">
              <span>Member Events</span>
              <span>Personal Styling</span>
              <span>Exclusive Drops</span>
              <span>Priority Care</span>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
