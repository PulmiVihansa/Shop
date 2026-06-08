import { useState } from 'react';
import { FiRefreshCw, FiShield, FiTruck } from 'react-icons/fi';
import '../styles/customer-care.css';

const reasons = ['Size exchange', 'Wrong item', 'Damaged on arrival', 'Changed my mind', 'Print issue'];

export default function Returns() {
  const [form, setForm] = useState({ order: '', email: '', item: '', reason: reasons[0], note: '' });
  const [toast, setToast] = useState('');

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submitReturn = (event) => {
    event.preventDefault();
    if (!form.order.trim() || !form.email.trim() || !form.item.trim()) {
      setToast('Add order number, email, and item name to start the return.');
      return;
    }
    setToast(`Return request opened: AST-RET-${Date.now().toString().slice(-5)}`);
  };

  return (
    <section className="care-page">
      <div className="care-shell">
        <header className="care-hero">
          <div className="care-hero-copy">
            <p className="care-kicker">Returns & Exchanges</p>
            <h1>RESET<br /><em>THE FIT.</em></h1>
            <p>Need another size or a return? Astravia returns are built to be fast, clean, and drama-free.</p>
          </div>
          <div className="care-logo-panel">
            <img src="/models/logo.png" alt="Astravia" />
          </div>
        </header>

        <div className="care-grid">
          {[
            [FiRefreshCw, '14-Day Window', 'Request returns or exchanges within 14 days of delivery.'],
            [FiTruck, 'Island-Wide Pickup', 'We help coordinate return pickup for eligible orders.'],
            [FiShield, 'Original Condition', 'Keep tees unworn, unwashed, and with tags attached.'],
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
            <span className="care-panel-label">Return Portal</span>
            <h2>Start A Return</h2>
            <p>Submit your details and the Astravia support team will reply with next steps.</p>
            <form className="care-form" onSubmit={submitReturn}>
              <div className="care-row">
                <label>
                  Order Number
                  <input value={form.order} onChange={update('order')} placeholder="ORD-1234" />
                </label>
                <label>
                  Email
                  <input type="email" value={form.email} onChange={update('email')} placeholder="you@email.com" />
                </label>
              </div>
              <div className="care-row">
                <label>
                  Item
                  <input value={form.item} onChange={update('item')} placeholder="Break Rules Tee - M" />
                </label>
                <label>
                  Reason
                  <select value={form.reason} onChange={update('reason')}>
                    {reasons.map((reason) => <option key={reason}>{reason}</option>)}
                  </select>
                </label>
              </div>
              <label>
                Notes
                <textarea value={form.note} onChange={update('note')} placeholder="Tell us what you need." />
              </label>
              <button className="care-button" type="submit">Submit Return</button>
            </form>
            {toast && <div className="care-toast">{toast}</div>}
          </main>

          <aside className="care-panel">
            <span className="care-panel-label">Policy</span>
            <h2>Return Rules</h2>
            <div className="care-list">
              {[
                ['Eligible Items', 'Astravia tees must be unworn, unwashed, and returned with original tags.'],
                ['Exchanges', 'Size exchanges are prioritized when stock is available.'],
                ['Refunds', 'Refunds are issued to the original payment method after inspection.'],
                ['Gift Vouchers', 'Gift vouchers are digital and non-refundable after purchase.'],
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
