import { useState } from 'react';
import Header from '../components/Header.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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

        

        .auth-shell {
          
          max-width: 1100px;
          margin: 5rem auto;
          display: grid;
          grid-template-columns: minmax(280px, 0.85fr) minmax(340px, 1fr);
          background: #fff;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(26, 26, 26, 0.18);
          border: 1px solid rgba(26, 26, 26, 0.08);
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
        }

        .brand-panel::before {
          content: '';
          position: absolute;
          top: 2.5rem;
          left: 0;
          width: 4px;
          height: 120px;
          background: var(--Ash);
        }

        .brand-panel::after {
          content: 'ATELIER';
          position: absolute;
          right: -20px;
          bottom: 30px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 6.5rem;
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
          font-size: 2.8rem;
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
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(250, 247, 242, 0.6);
        }

        .form-panel {
          padding: 3.75rem 4rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2rem;
          background: #ffffff;
        }

        .form-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.2rem;
          font-weight: 400;
          letter-spacing: 0.08em;
          margin-bottom: 0.3rem;
        }

        .form-subtitle {
          color: rgba(26, 26, 26, 0.6);
          font-size: 0.95rem;
          margin-bottom: 1.5rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .auth-form label {
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(26, 26, 26, 0.6);
        }

        .auth-form input {
          width: 140%;
          padding: 0.85rem 1rem;
          border: 1px solid #d8d2cb;
          border-radius: 12px;
          background: #faf8f6;
          font-size: 0.95rem;
          transition: border 0.3s ease, box-shadow 0.3s ease;
        }

        .auth-form input:focus {
          outline: none;
          border-color: var(--Ash);
          box-shadow: 0 0 0 3px rgba(143, 147, 144, 0.2);
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
          top: 12px;
          transform: none;
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
          padding: 1rem;
          border: none;
          background: var(--charcoal);
          color: var(--cream);
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 0.78rem;
          cursor: pointer;
          border-radius: 999px;
          transition: transform 0.2s ease, background 0.3s ease;
          margin-left: 4.5rem;
          margin-top: 1.5rem;
        }

        .primary-btn:hover {
          background: #111;
          transform: translateY(-1px);
        }

        .form-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;
          color: rgba(26, 26, 26, 0.6);
        }

        .form-footer a {
          color: var(--Ash);
          text-decoration: none;
          font-weight: 600;
        }

        .divider {
          height: 1px;
          background: #e6e0d8;
          margin: 0.75rem 0 0.5rem;
        }

        .ghost-btn {
          width: 100%;
          padding: 0.95rem;
          border: 1px solid var(--charcoal);
          background: transparent;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 0.76rem;
          cursor: pointer;
          border-radius: 999px;
          color: var(--charcoal);
          text-align: center;
          text-decoration: none;
        }

        @media (max-width: 960px) {
          .auth-shell {
            grid-template-columns: 1fr;
          }

          .brand-panel {
            
            padding: 3rem 2.5rem;
          }

          .form-panel {
            padding: 3rem 2.5rem 3.5rem;
          }
        }

        @media (max-width: 600px) {
          .auth-page {
            padding: 7.5rem 1rem 3rem;
          }

          .brand-panel::after {
            font-size: 4.5rem;
          }

          .form-panel {
            padding: 2.5rem 1.75rem 3rem;
          }
        }
      `}</style>

      <div className="auth-page">
        <div className="auth-shell">
          <aside className="brand-panel">
            <div>
              <div className="brand-kicker">ATELIER</div>
              <h1 className="brand-title">A return to refined essentials.</h1>
              <p className="brand-copy">
                Sign in to revisit your saved looks, curated edits, and private releases crafted for a quieter, more
                intentional wardrobe.
              </p>
            </div>
            <div className="brand-highlights">
              <span>New Season</span>
              <span>Private Edits</span>
              <span>Tailored Fits</span>
              <span>Atelier Care</span>
            </div>
          </aside>

          <div className="form-panel">
            <div>
              <h2 className="form-title">Welcome back</h2>
              <p className="form-subtitle">Sign in to access your Atelier account.</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@atelier.com"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />

              <label htmlFor="login-password">Password</label>
              <div className="password-field">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
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

              {error && <p className="form-subtitle" style={{ color: 'var(--Ash)', marginBottom: 0 }}>{error}</p>}
              <button className="primary-btn" type="submit" disabled={submitting}>
                {submitting ? 'Signing in...' : 'Log in'}
              </button>
            </form>

            <div className="form-footer">
              <span>Forgot your password?</span>
              <a href="#">Reset it</a>
            </div>

            <div className="divider" />

            <Link to="/signup" className="ghost-btn">Create account</Link>
          </div>
        </div>
      </div>
    </>
  );
}
