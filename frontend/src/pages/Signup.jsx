import { useState } from 'react';
import Header from '../components/Header.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register({
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        password: form.password,
      });
      navigate('/');
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
          gap: 1.25rem;
          background: #ffffff;
        }

        .form-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.3rem;
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
          gap: 0.85rem;
        }

       .row {
  display: grid;
  grid-template-columns: 5fr 5fr;
  gap: 5.2rem; 
  
}

        .auth-form label {
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(26, 26, 26, 0.6);
        }

        .auth-form input {
          width: 150%;
          padding: 1.2rem 1.1rem;
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
          width: 70%;
          padding: 1.15rem;
          border: none;
          background: var(--charcoal);
          color: var(--cream);
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 0.78rem;
          cursor: pointer;
          border-radius: 999px;
          transition: transform 0.2s ease, background 0.3s ease;
          align-self: center;
          margin-left: 50%;
        }

        .primary-btn:hover {
          background: #111;
          transform: translateY(-1px);
        }

        .divider {
          height: 1px;
          background: #e6e0d8;
          margin: 0.35rem 0 0.2rem;
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
            <div>
              <h2 className="form-title">Create your account</h2>
              <p className="form-subtitle">Join Atelier to unlock curated edits and private releases.</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
             
                <div>
                  <label htmlFor="signup-first">First name</label>
                  <input
                    id="signup-first"
                    type="text"
                    placeholder="Enter your first name"
                    value={form.firstName}
                    onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="signup-last">Last name</label>
                  <input
                    id="signup-last"
                    type="text"
                    placeholder="Enter your last name"
                    value={form.lastName}
                    onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                  />
                </div>
              

              <label htmlFor="signup-email">Email</label>
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

              {error && <p className="form-subtitle" style={{ color: 'var(--Ash)', marginBottom: 0 }}>{error}</p>}
              <button className="primary-btn" type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create account'}
              </button>
            </form>

            <div className="divider" />
            <Link to="/login" className="ghost-btn">Already a member</Link>
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
