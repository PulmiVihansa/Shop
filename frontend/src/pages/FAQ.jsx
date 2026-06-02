import { FiHelpCircle, FiPackage, FiRefreshCw } from 'react-icons/fi';
import '../styles/customer-care.css';

const faqs = [
  ['How do Astravia tees fit?', 'Most Astravia tees use an oversized streetwear fit. Choose your usual size for a relaxed silhouette or size down for a cleaner fit.'],
  ['How long does delivery take?', 'Colombo orders usually arrive in 1-3 business days. Island-wide delivery usually arrives in 3-5 business days.'],
  ['Can I pay cash on delivery?', 'Yes, product orders support COD. Gift vouchers are card payment only.'],
  ['Can I return a tee?', 'Yes, eligible unworn tees can be returned or exchanged within 14 days of delivery.'],
  ['How do gift vouchers work?', 'Choose a voucher amount, pay by card, then deliver it by email or download the PDF after purchase.'],
  ['Where is Astravia based?', 'Astravia is based in Sri Lanka with pickup and support handled from Colombo.'],
];

export default function FAQ() {
  return (
    <section className="care-page">
      <div className="care-shell">
        <header className="care-hero">
          <div className="care-hero-copy">
            <p className="care-kicker">FAQ</p>
            <h1>ASKED.<br /><em>ANSWERED.</em></h1>
            <p>Fast answers for sizing, delivery, returns, vouchers, and Astravia drop rules.</p>
          </div>
          <div className="care-logo-panel">
            <img src="/models/logo.png" alt="Astravia" />
          </div>
        </header>

        <div className="care-grid">
          {[
            [FiHelpCircle, 'Fit Help', 'Oversized sizing and product guidance.'],
            [FiPackage, 'Order Help', 'Payment, delivery, and tracking answers.'],
            [FiRefreshCw, 'Returns', 'Exchange and refund policy details.'],
          ].map(([Icon, title, text]) => (
            <article className="care-card" key={title}>
              <Icon aria-hidden="true" />
              <span>{title}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <main className="care-panel">
          <span className="care-panel-label">Questions</span>
          <h2>Astravia Help Index</h2>
          <div className="care-faq">
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </main>
      </div>
    </section>
  );
}
