import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/giftvoucher.css';
import usePageContent, { lines } from '../hooks/usePageContent.js';

const amountOptions = [
  { value: 100, label: 'LKR100', sub: 'Starter' },
  { value: 250, label: 'LKR250', sub: 'Popular' },
  { value: 500, label: 'LKR500', sub: 'Generous' },
  { value: 1000, label: 'LKR1,000', sub: 'Luxe' },
];

const themeLabels = {
  classic: 'Classic',
  Ash: 'Ash',
  sage: 'Sage',
  cream: 'Cream',
};

const faqItems = [
  {
    question: 'Can a voucher be used across multiple purchases?',
    answer:
      'Yes. If the order total is less than the voucher value, the remaining balance is saved automatically to the same code and can be used on any future purchase within the validity period.',
  },
  {
    question: 'Can I send the voucher on a future date?',
    answer:
      "Absolutely. Select a future send date and we will hold the voucher in our system, delivering it to the recipient's inbox exactly on that day.",
  },
  {
    question: 'Are gift vouchers refundable?',
    answer:
      'Unredeemed vouchers can be refunded within 14 days of purchase. Once a voucher has been redeemed in full or in part, the remaining balance is non-refundable but remains valid for the full three-year period.',
  },
  {
    question: 'Can vouchers be used on sale items?',
    answer:
      'Yes. Gift vouchers are accepted on all items across our full collection, including sale and seasonal pieces, both online and in our atelier.',
  },
];

const formatCurrency = (value) => `LKR${value.toLocaleString()}`;

const formatExpiry = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  date.setFullYear(date.getFullYear() + 3);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

export default function GiftVoucher() {
  const content = usePageContent('giftvoucher');
  const today = new Date().toISOString().split('T')[0];
  const [amount, setAmount] = useState(250);
  const [selectedAmount, setSelectedAmount] = useState(250);
  const [customAmount, setCustomAmount] = useState('');
  const [theme, setTheme] = useState('classic');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [sendDate, setSendDate] = useState(today);
  const [delivery, setDelivery] = useState('email');
  const [toast, setToast] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [purchaseState, setPurchaseState] = useState('idle');
  const [cardStyle, setCardStyle] = useState({});
  const toastTimer = useRef(null);
  const purchaseTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (purchaseTimer.current) clearTimeout(purchaseTimer.current);
    };
  }, []);

  const expiryText = useMemo(() => formatExpiry(sendDate || today), [sendDate, today]);

  const showToast = (messageText) => {
    setToast(messageText);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  };

  const handleAmountSelect = (value) => {
    setAmount(value);
    setSelectedAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmount = (value) => {
    setCustomAmount(value);
    const numeric = parseInt(value, 10);
    if (!Number.isNaN(numeric) && numeric >= 50) {
      setAmount(numeric);
      setSelectedAmount('custom');
    }
  };

  const handleThemeSelect = (nextTheme) => {
    setTheme(nextTheme);
  };

  const handleDeliveryChange = (value) => {
    setDelivery(value);
  };

  const handlePurchase = () => {
    if (!recipientName.trim()) {
      showToast("Please enter the recipient's name");
      return;
    }
    if (!recipientEmail.trim()) {
      showToast("Please enter the recipient's email");
      return;
    }
    setPurchaseState('processing');
    purchaseTimer.current = setTimeout(() => {
      setPurchaseState('success');
      showToast(`Voucher sent to ${recipientEmail}`);
    }, 1800);
  };

  const handleSave = () => {
    showToast('Voucher configuration saved for later');
  };

  const handleCardMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (event.clientX - cx) / (rect.width / 2);
    const dy = (event.clientY - cy) / (rect.height / 2);
    setCardStyle({
      transform: `perspective(900px) rotateX(${(-dy * 6).toFixed(2)}deg) rotateY(${(dx * 8).toFixed(2)}deg) scale(1.02)`,
    });
  };

  const handleCardLeave = () => {
    setCardStyle({ transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)' });
  };

  const orderRecipient = recipientName.trim() || '—';
  const previewRecipient = recipientName.trim() ? `For ${recipientName.trim()}` : 'For someone special';
  const orderDelivery = delivery === 'email' ? 'Email' : 'Print at Home';
  const orderTheme = themeLabels[theme] || theme;
  const amountLabel = formatCurrency(amount);

  return (
    <div className="gift-page">
      <section className="page-hero">
        <div className="hero-left">
          <div className="hero-eyebrow">{content.eyebrow}</div>
          <h1 className="hero-title">
            {lines(content.title).map((line, index) => (
              index === lines(content.title).length - 1
                ? <em key={line}>{line}</em>
                : <span key={line}>{line}<br /></span>
            ))}
          </h1>
          <p className="hero-desc">{content.description}</p>
          <div className="hero-facts">
            <div>
              <span className="hero-fact-val">{content.factOneValue}</span>
              <span className="hero-fact-lbl">{content.factOneLabel}</span>
            </div>
            <div>
              <span className="hero-fact-val">{content.factTwoValue}</span>
              <span className="hero-fact-lbl">{content.factTwoLabel}</span>
            </div>
            <div>
              <span className="hero-fact-val">{content.factThreeValue}</span>
              <span className="hero-fact-lbl">{content.factThreeLabel}</span>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div
            className="voucher-preview"
            onMouseMove={handleCardMove}
            onMouseLeave={handleCardLeave}
            style={cardStyle}
          >
            <div className={`voucher-face theme-${theme}`}>
              <div className="voucher-pattern" />
              <div className="voucher-corner tl" />
              <div className="voucher-corner tr" />
              <div className="voucher-corner bl" />
              <div className="voucher-corner br" />

              <div className="voucher-top">
                <span className="voucher-brand">ATELIER</span>
                <span className="voucher-type-tag">Gift Voucher</span>
              </div>

              <div className="voucher-mid">
                <div className="voucher-amount">{amountLabel}</div>
                <div className="voucher-recipient">{previewRecipient}</div>
              </div>

              <div className="voucher-bottom">
                <div>
                  <div className="voucher-code-label">Voucher Code</div>
                  <div className="voucher-code">ATL-XXXX-XXXX</div>
                </div>
                <div className="voucher-valid">
                  <div className="voucher-valid-label">Valid Until</div>
                  <div className="voucher-valid-date">{expiryText}</div>
                </div>
              </div>
            </div>
          </div>
          <p className="flip-hint">{content.previewHint}</p>
        </div>
      </section>

      <div className="gift-layout">
        <div className="config-panel">
          <div className="config-section">
            <div className="config-label">
              <span>1</span> {content.amountTitle}
            </div>
            <div className="amount-grid">
              {amountOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`amount-btn ${selectedAmount === option.value ? 'active' : ''}`}
                  onClick={() => handleAmountSelect(option.value)}
                >
                  <span>
                    {option.label}
                    <span className="amount-sub">{option.sub}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="custom-amount-wrap">
              <span className="custom-prefix">LKR</span>
              <input
                type="number"
                className="custom-amount-input"
                placeholder="Enter custom amount"
                min="50"
                max="5000"
                value={customAmount}
                onChange={(event) => handleCustomAmount(event.target.value)}
              />
            </div>
          </div>

          <div className="config-section">
            <div className="config-label">
              <span>2</span> {content.designTitle}
            </div>
            <div className="theme-grid">
              {['classic', 'Ash', 'sage', 'cream'].map((variant) => (
                <div
                  key={variant}
                  className={`theme-swatch t-${variant} ${theme === variant ? 'active' : ''}`}
                  onClick={() => handleThemeSelect(variant)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      handleThemeSelect(variant);
                    }
                  }}
                >
                  <span className="theme-swatch-name">{themeLabels[variant]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="config-section">
            <div className="config-label">
              <span>3</span> {content.personalTitle}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="recipientName">Recipient&apos;s Name</label>
                <input
                  id="recipientName"
                  type="text"
                  placeholder="e.g. Olivia"
                  maxLength={30}
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="recipientEmail">Recipient&apos;s Email</label>
                <input
                  id="recipientEmail"
                  type="email"
                  placeholder="olivia@example.com"
                  value={recipientEmail}
                  onChange={(event) => setRecipientEmail(event.target.value)}
                />
              </div>
            </div>
            <div className="form-row full">
              <div className="form-group">
                <label htmlFor="giftMessage">Your Message (optional)</label>
                <textarea
                  id="giftMessage"
                  placeholder="Write a personal note to accompany the voucher..."
                  maxLength={160}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
                <span className="char-count">{message.length} / 160</span>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="senderName">From</label>
                <input
                  id="senderName"
                  type="text"
                  placeholder="Your name"
                  maxLength={30}
                  value={senderName}
                  onChange={(event) => setSenderName(event.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="sendDate">Send Date</label>
                <input
                  id="sendDate"
                  type="date"
                  value={sendDate}
                  onChange={(event) => setSendDate(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="config-section">
            <div className="config-label">
              <span>4</span> {content.deliveryTitle}
            </div>
            <div className="delivery-grid">
              <label className={`delivery-option ${delivery === 'email' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="delivery"
                  value="email"
                  checked={delivery === 'email'}
                  onChange={() => handleDeliveryChange('email')}
                />
                <div className="delivery-check" />
                <svg className="delivery-icon" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <polyline points="22,4 12,13 2,4" />
                </svg>
                <div className="delivery-name">Email</div>
                <div className="delivery-desc">
                  Sent instantly to recipient&apos;s inbox with a beautiful digital card.
                </div>
              </label>

              <label className={`delivery-option ${delivery === 'print' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="delivery"
                  value="print"
                  checked={delivery === 'print'}
                  onChange={() => handleDeliveryChange('print')}
                />
                <div className="delivery-check" />
                <svg className="delivery-icon" viewBox="0 0 24 24">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <div className="delivery-name">Print at Home</div>
                <div className="delivery-desc">
                  Download a high-resolution PDF to print and give in person.
                </div>
              </label>
            </div>
          </div>
        </div>

        <aside className="order-panel">
          <div className="order-title">{content.summaryTitle}</div>

          <div className="order-row">
            <span className="order-row-lbl">Voucher value</span>
            <span className="order-row-val">{amountLabel}</span>
          </div>
          <div className="order-row">
            <span className="order-row-lbl">Design</span>
            <span className="order-row-val">{orderTheme}</span>
          </div>
          <div className="order-row">
            <span className="order-row-lbl">Delivery</span>
            <span className="order-row-val">{orderDelivery}</span>
          </div>
          <div className="order-row">
            <span className="order-row-lbl">Recipient</span>
            <span className="order-row-val">{orderRecipient}</span>
          </div>

          <div className="order-total-block">
            <div className="order-total-lbl">You Pay</div>
            <div className="order-total-val">{amountLabel}</div>
          </div>

          <button
            className="purchase-btn"
            type="button"
            onClick={handlePurchase}
            disabled={purchaseState === 'processing' || purchaseState === 'success'}
          >
            {purchaseState === 'processing'
              ? 'Processing...'
              : purchaseState === 'success'
                ? 'Voucher Purchased'
                : content.purchaseButton}
          </button>
          <button className="save-btn" type="button" onClick={handleSave}>
            {content.saveButton}
          </button>

          <div className="order-guarantee">
            <div className="guarantee-item">
              <svg className="guarantee-icon" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <div className="guarantee-text">
                <strong>Secure Purchase</strong>
                SSL encrypted. Your payment is fully protected.
              </div>
            </div>
            <div className="guarantee-item">
              <svg className="guarantee-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <div className="guarantee-text">
                <strong>3-Year Validity</strong>
                Unused balance never expires within three years of purchase.
              </div>
            </div>
            <div className="guarantee-item">
              <svg className="guarantee-icon" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <div className="guarantee-text">
                <strong>Personal Support</strong>
                Any issue with your voucher? We will resolve it within 2 hours.
              </div>
            </div>
          </div>
        </aside>
      </div>

      <section className="how-section">
        <div className="how-header">
          <span className="how-label">{content.processEyebrow}</span>
          <h2 className="how-title">{content.processTitle}</h2>
        </div>
        <div className="how-steps">
          {[
            {
              num: '01',
              title: 'Choose & Personalise',
              desc: 'Select your amount, pick a design, and write a personal message. Takes under two minutes.',
            },
            {
              num: '02',
              title: 'Delivered Instantly',
              desc: "The voucher arrives in the recipient's inbox with your message, beautifully formatted. Or download a PDF to present in person.",
            },
            {
              num: '03',
              title: 'Recipient Redeems',
              desc: 'They shop online or in-store, entering the unique code at checkout. Partial redemptions leave a balance for next time.',
            },
            {
              num: '04',
              title: 'Valid for 3 Years',
              desc: 'No pressure, no rush. The voucher stays active for three full years from the date of purchase.',
            },
          ].map((step) => (
            <div key={step.num} className="how-step">
              <div className="step-num">{step.num}</div>
              <div className="step-title">{step.title}</div>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="faq-section">
        <h3 className="faq-title">{content.faqTitle}</h3>

        {faqItems.map((item, index) => (
          <div key={item.question} className={`faq-item ${openFaq === index ? 'open' : ''}`}>
            <button
              className="faq-q"
              type="button"
              onClick={() => setOpenFaq(openFaq === index ? null : index)}
            >
              {item.question}
              <svg viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <div className="faq-a">
              <div className="faq-a-inner">{item.answer}</div>
            </div>
          </div>
        ))}
      </section>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
