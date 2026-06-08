import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api.js';
import { useToast } from '../components/ToastProvider.jsx';
import '../styles/auth-streetwear.css';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Email is required');
      return;
    }
    if (!emailPattern.test(normalizedEmail)) {
      setError('Enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: normalizedEmail });
      const successMessage = response.data?.message || 'Reset link sent to your email.';
      setMessage(successMessage);
      toast.success('Reset link sent to your email.');
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage || 'Something went wrong.');
      toast.error(errorMessage || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="astravia-auth-page">
      <div className="auth-image-panel">
        <img src="/models/login_img.png" alt="Astravia password reset campaign" className="auth-side-image" />
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <p className="auth-kicker">Account Recovery</p>
          <h2>Forgot Password</h2>
          {message && <div className="auth-message">{message}</div>}
          {error && <div className="auth-error">{error}</div>}

          <form className="street-auth-form" onSubmit={handleSubmit}>
            <label>
              Email Address
              <input
                type="email"
                value={email}
                autoComplete="email"
                required
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <button className="auth-primary-btn" type="submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="auth-switch-link">
            <span>Remembered it?</span>
            <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
