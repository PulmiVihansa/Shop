import { useState } from 'react';
import { FiMail, FiMessageCircle, FiPackage } from 'react-icons/fi';
import '../styles/customer-care.css';

const topics = ['Order support', 'Sizing help', 'Returns', 'Gift vouchers', 'Collabs'];

export default function Support() {
  const [form, setForm] = useState({ topic: topics[0], name: '', email: '', order: '', message: '' });
  const [toast, setToast] = useState('');
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    if (!form.email.trim() || !form.message.trim()) {
      setToast('Add your email and message so Astravia support can reply.');
      return;
    }
    setToast(`Support ticket opened: AST-SUP-${Date.now().toString().slice(-5)}`);
    setForm({ topic: topics[0], name: '', email: '', order: '', message: '' });
  };

  return (
    <section className="care-page">
      <div className="care-shell">
        <header className="care-hero">
          <div className="care-hero-copy">
            <p className="care-kicker">Support</p>
            <h1>WE GOT<br /><em>YOUR BACK.</em></h1>
            <p>Need help with a drop, order, voucher, return, or fit? Send the details and the Astravia team will respond.</p>
          </div>
          <div className="care-logo-panel">
            <img src="/models/logo.png" alt="Astravia" />
          </div>
        </header>

        <div className="care-grid">
          {[
            [FiMail, 'Email', 'support@astravia.lk'],
            [FiMessageCircle, 'WhatsApp', '+94 77 123 4567'],
            [FiPackage, 'Orders', 'Track and update support'],
          ].map(([Icon, title, text]) => (
            <article className="care-card" key={title}>
              <Icon aria-hidden="true" />
              <span>{title}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <div className="care-layout">
          <main className="care-panel">
            <span className="care-panel-label">Support Desk</span>
            <h2>Open A Ticket</h2>
            <form className="care-form" onSubmit={submit}>
              <div className="care-row">
                <label>
                  Topic
                  <select value={form.topic} onChange={update('topic')}>
                    {topics.map((topic) => <option key={topic}>{topic}</option>)}
                  </select>
                </label>
                <label>
                  Order ID
                  <input value={form.order} onChange={update('order')} placeholder="ORD-1234" />
                </label>
              </div>
              <div className="care-row">
                <label>
                  Name
                  <input value={form.name} onChange={update('name')} placeholder="Your name" />
                </label>
                <label>
                  Email
                  <input type="email" value={form.email} onChange={update('email')} placeholder="you@email.com" />
                </label>
              </div>
              <label>
                Message
                <textarea value={form.message} onChange={update('message')} placeholder="Tell us what you need." />
              </label>
              <button className="care-button" type="submit">Send To Support</button>
            </form>
            {toast && <div className="care-toast">{toast}</div>}
          </main>

          <aside className="care-panel">
            <span className="care-panel-label">Response Times</span>
            <h2>Support Flow</h2>
            <div className="care-list">
              {[
                ['Orders', 'Usually answered within 2-4 hours during support hours.'],
                ['Returns', 'Return requests are reviewed within one business day.'],
                ['Sizing', 'Send height, weight, and desired fit for the best recommendation.'],
              ].map(([title, text]) => (
                <article key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
