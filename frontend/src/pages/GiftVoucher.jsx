import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/giftvoucher.css';

const amounts = [2500, 5000, 10000, 20000];
const voucherDesigns = [
  { id: 'classic', name: 'Classic Red', note: 'Signature Astravia black and red finish.' },
  { id: 'steel', name: 'Steel Drop', note: 'Darker metallic campaign styling.' },
  { id: 'ember', name: 'Ember Glow', note: 'Deep red glow for premium gifting.' },
];

const faqs = [
  {
    question: 'How is the gift voucher delivered?',
    answer: 'You can send it by email instantly or download a PDF version after purchase.',
  },
  {
    question: 'Can it be used on any Astravia product?',
    answer: 'Yes. Gift vouchers can be redeemed on tees, limited drops, and future Astravia releases.',
  },
  {
    question: 'Can I change the recipient after buying?',
    answer: 'Recipient details are locked after checkout, so double-check the email before purchase.',
  },
  {
    question: 'Does the voucher expire?',
    answer: 'Yes. The expiry date is shown on the voucher before you buy.',
  },
];

const formatAmount = (value) => `Rs. ${Number(value).toLocaleString()}`;

const formatValidUntil = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  return `${day} ${month} ${date.getFullYear()}`;
};

export default function GiftVoucher() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState(5000);
  const [design, setDesign] = useState('classic');
  const [delivery, setDelivery] = useState('email');
  const [senderEmail, setSenderEmail] = useState(user?.email || '');
  const [recipient, setRecipient] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [toast, setToast] = useState('');
  const validUntil = useMemo(() => formatValidUntil(), []);
  const selectedDesign = voucherDesigns.find((item) => item.id === design) ?? voucherDesigns[0];

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const paymentRequiredToast = () => showToast('Please complete voucher payment first.');

  const buyVoucher = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim())) {
      showToast('Add a valid buyer email before checkout.');
      return;
    }

    if (!recipient.name.trim()) {
      showToast('Add the recipient name before checkout.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email.trim())) {
      showToast('Add a valid recipient email for delivery.');
      return;
    }

    navigate('/payment', {
      state: {
        orderType: 'voucher',
        paymentMethod: 'card',
        cardOnly: true,
        items: [
          {
            productId: `gift-voucher-${amount}-${design}`,
            name: `${selectedDesign.name} Gift Voucher`,
            image: '/models/logo.png',
            color: delivery === 'email' ? 'Email Delivery' : 'PDF Download',
            size: 'Generated after payment',
            quantity: 1,
            price: amount,
          },
        ],
        subtotal: amount,
        shipping: 0,
        discount: 0,
        total: amount,
        customerName: user?.name || 'Astravia Customer',
        customerEmail: senderEmail.trim(),
        voucher: {
          amount,
          design: selectedDesign.name,
          delivery,
          validUntil,
          senderEmail: senderEmail.trim(),
          recipient: {
            name: recipient.name.trim(),
            email: recipient.email.trim(),
            message: recipient.message.trim(),
          },
        },
      },
    });
  };

  return (
    <section className="astravia-voucher-page">
      <div className="astravia-voucher-shell">
        <div className="voucher-page-intro">
          <span>Digital Gift Card</span>
          <h1>Gift Astravia Energy.</h1>
          <p>Choose a value, copy the code, and send a premium Astravia voucher built for exclusive drops.</p>
        </div>

        <div className={`astravia-voucher-card voucher-design-${design}`}>
          <div className="voucher-left">
            <div className="voucher-brand-row">
              <span className="small-compass" aria-hidden="true" />
              <div>
                <img src="/models/logo.png" alt="Astravia" />
                <p>REBORN. REBEL. REPEAT.</p>
              </div>
            </div>

            <div className="voucher-title">
              <span>GIFT</span>
              <strong>VOUCHER</strong>
            </div>

            <div className="voucher-value">
              <small>VALUE</small>
              <strong>{formatAmount(amount)}</strong>
            </div>

            <div className="voucher-bottom-info">
              <div className="voucher-code-box">
                <span>Voucher Code</span>
                <button type="button" onClick={paymentRequiredToast} aria-label="Voucher code available after payment">
                  Generated after payment
                  <em>Locked</em>
                </button>
              </div>
              <div className="voucher-valid-box">
                <span>Valid Until</span>
                <strong>{validUntil}</strong>
              </div>
            </div>
          </div>

          <div className="voucher-right">
            <span className="paint-splatter" aria-hidden="true" />
            <span className="serial-text">SERIAL NO.<br />A5K-2025-0001</span>
            <div className="large-compass" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <div className="voucher-controls">
          <div className="voucher-amount-selector" aria-label="Voucher amount selector">
            {amounts.map((value) => (
              <button
                type="button"
                className={amount === value ? 'active' : ''}
                key={value}
                onClick={() => setAmount(value)}
              >
                {formatAmount(value)}
              </button>
            ))}
          </div>
          <button className="buy-gift-card" type="button" onClick={buyVoucher}>Buy Gift Card</button>
        </div>

        <div className="voucher-purchase-layout">
          <div className="voucher-purchase-main">
            <section className="voucher-panel">
              <div className="voucher-section-heading">
                <span>Voucher Design</span>
                <h2>Choose the finish.</h2>
              </div>
              <div className="voucher-design-selector">
                {voucherDesigns.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={design === item.id ? 'active' : ''}
                    onClick={() => setDesign(item.id)}
                  >
                    <span className={`design-swatch design-swatch-${item.id}`} />
                    <strong>{item.name}</strong>
                    <em>{item.note}</em>
                  </button>
                ))}
              </div>
            </section>

            <section className="voucher-panel">
              <div className="voucher-section-heading">
                <span>Recipient Details</span>
                <h2>Send it to someone legendary.</h2>
              </div>
              <div className="voucher-recipient-form">
                <label>
                  Buyer Email
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(event) => setSenderEmail(event.target.value)}
                    placeholder="your@email.com"
                  />
                </label>
                <label>
                  Recipient Name
                  <input
                    type="text"
                    value={recipient.name}
                    onChange={(event) => setRecipient((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Enter recipient name"
                  />
                </label>
                <label>
                  Recipient Email
                  <input
                    type="email"
                    value={recipient.email}
                    onChange={(event) => setRecipient((current) => ({ ...current, email: event.target.value }))}
                    placeholder="name@email.com"
                  />
                </label>
                <label className="voucher-message-field">
                  Gift Message
                  <textarea
                    value={recipient.message}
                    onChange={(event) => setRecipient((current) => ({ ...current, message: event.target.value }))}
                    placeholder="Add a short message"
                    rows="4"
                  />
                </label>
              </div>
            </section>

            <section className="voucher-panel">
              <div className="voucher-section-heading">
                <span>Delivery</span>
                <h2>Choose delivery format.</h2>
              </div>
              <div className="voucher-delivery-toggle">
                <button
                  type="button"
                  className={delivery === 'email' ? 'active' : ''}
                  onClick={() => {
                    setDelivery('email');
                    paymentRequiredToast();
                  }}
                >
                  Email Delivery
                </button>
                <button
                  type="button"
                  className={delivery === 'pdf' ? 'active' : ''}
                  onClick={() => {
                    setDelivery('pdf');
                    paymentRequiredToast();
                  }}
                >
                  PDF Download
                </button>
              </div>
            </section>
          </div>

          <aside className="voucher-order-summary">
            <span>Order Summary</span>
            <h2>{formatAmount(amount)}</h2>
            <dl>
              <div>
                <dt>Design</dt>
                <dd>{selectedDesign.name}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{delivery === 'email' ? 'Email' : 'PDF'}</dd>
              </div>
              <div>
                <dt>Recipient</dt>
                <dd>{recipient.name || 'Not added'}</dd>
              </div>
              <div>
                <dt>Code</dt>
                <dd>Generated after payment</dd>
              </div>
            </dl>
            <button className="buy-gift-card summary-buy-button" type="button" onClick={buyVoucher}>Complete Purchase</button>
          </aside>
        </div>

        <div className="voucher-details-grid">
          <article className="voucher-detail-card voucher-summary-card">
            <span>Selected Value</span>
            <strong>{formatAmount(amount)}</strong>
            <p>Instant digital delivery after checkout with a unique redeemable Astravia code.</p>
          </article>

          <article className="voucher-detail-card">
            <span>Redeemable On</span>
            <h2>All Products</h2>
            <p>Use it for tees, limited drops, gift-ready essentials, and future Astravia releases.</p>
          </article>

          <article className="voucher-detail-card">
            <span>Valid Online</span>
            <h2>Online & In-Store</h2>
            <p>Works across Astravia checkout and pickup purchases until the displayed expiry date.</p>
          </article>

          <article className="voucher-detail-card">
            <span>Policy</span>
            <h2>Non-Refundable</h2>
            <p>Gift cards are non-transferable, non-refundable, and cannot be exchanged for cash.</p>
          </article>
        </div>

        <section className="voucher-how-it-works">
          <div className="voucher-section-heading">
            <span>How It Works</span>
            <h2>From value to checkout in three steps.</h2>
          </div>
          <div className="voucher-steps">
            <article>
              <strong>01</strong>
              <h3>Select Value</h3>
              <p>Pick the amount and visual finish for the voucher.</p>
            </article>
            <article>
              <strong>02</strong>
              <h3>Add Recipient</h3>
              <p>Enter the recipient details and an optional message.</p>
            </article>
            <article>
              <strong>03</strong>
              <h3>Deliver</h3>
              <p>Send by email or download the PDF after purchase.</p>
            </article>
          </div>
        </section>

        <section className="voucher-faq-section">
          <div className="voucher-section-heading">
            <span>FAQ</span>
            <h2>Gift card details.</h2>
          </div>
          <div className="voucher-faq-list">
            {faqs.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {toast && <div className="voucher-toast">{toast}</div>}
    </section>
  );
}
