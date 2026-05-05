import { useEffect, useRef, useState } from 'react';
import '../styles/returns.css';

const steps = [
  { id: 1, label: 'Order' },
  { id: 2, label: 'Reason' },
  { id: 3, label: 'Confirm' },
];

const reasonOptions = [
  "Doesn't fit",
  'Changed my mind',
  'Not as described',
  'Quality issue',
  'Wrong item received',
  'Arrived damaged',
  'Bought two sizes',
  'Gift not needed',
];

const itemOptions = [
  'Structured Linen Blazer - Size S',
  'Flowing Silk Midi - Size XS',
  'Relaxed Cotton Shirt - Size M',
  'Velvet Wide Trousers - Size S',
  'Cashmere Roll-Neck - Size M',
  'Suede Chelsea Boot - Size 42',
  'Washed Canvas Tote',
  'Other item',
];

const exchangeSizes = ['XS', 'S', 'M', 'L', 'XL'];
const exchangeColors = ['Same colour', 'Ivory', 'Stone', 'Ash', 'Sage'];

export default function Returns() {
  const [step, setStep] = useState(1);
  const [returnType, setReturnType] = useState('refund');
  const [orderNum, setOrderNum] = useState('');
  const [orderEmail, setOrderEmail] = useState('');
  const [itemSel, setItemSel] = useState('');
  const [exchangeSize, setExchangeSize] = useState('M');
  const [exchangeColor, setExchangeColor] = useState('Same colour');
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [condition, setCondition] = useState('Unworn, tags attached');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successRef, setSuccessRef] = useState('RET-000000');
  const [toast, setToast] = useState('');
  const [trackRef, setTrackRef] = useState('');
  const [showTracker, setShowTracker] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    document.title = 'ATELIER - Returns & Exchanges';
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (message) => {
    setToast(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToast(''), 3000);
  };

  const goStep = (nextStep) => {
    if (showSuccess) return;
    if (nextStep === 2) {
      if (!orderNum.trim() || !orderEmail.trim() || !itemSel) {
        showToast('Please fill in all fields to continue');
        return;
      }
    }
    setStep(nextStep);
  };

  const submitReturn = () => {
    const ref = `RET-${Math.floor(100000 + Math.random() * 900000)}`;
    setSuccessRef(ref);
    setShowSuccess(true);
    showToast('Return submitted - label sent to your email');
  };

  const trackReturn = () => {
    if (!trackRef.trim()) {
      showToast('Please enter a return reference');
      return;
    }
    setShowTracker(true);
  };

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const confirmType = returnType === 'refund' ? 'Full Refund' : 'Exchange';
  const confirmAmount = returnType === 'refund' ? 'Full refund' : 'Replacement item';

  return (
    <div className="returns-page">
      <header className="ph">
        <div className="ph-inner">
          <div>
            <div className="ey">Hassle-free, always</div>
            <h1 className="ph-h">
              Returns &amp;
              <br />
              <em>Exchanges</em>
            </h1>
          </div>
          <div className="ph-promises">
            <div className="promise">
              <div className="p-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="p-text">
                <strong>30 days to return</strong>
                <span>No questions asked. Just let us know within 30 days of delivery.</span>
              </div>
            </div>
            <div className="promise">
              <div className="p-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
              <div className="p-text">
                <strong>Free return shipping</strong>
                <span>We cover the cost of your return, anywhere in the world.</span>
              </div>
            </div>
            <div className="promise">
              <div className="p-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="p-text">
                <strong>Refund in 3-5 days</strong>
                <span>Once we receive your return, your refund lands in 3-5 working days.</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="policy-strip">
        <div className="pol-cell">
          <div className="pol-val">30</div>
          <div className="pol-lbl">Day return window</div>
          <div className="pol-note">From delivery date</div>
        </div>
        <div className="pol-cell">
          <div className="pol-val">Free</div>
          <div className="pol-lbl">Return shipping</div>
          <div className="pol-note">Worldwide, always</div>
        </div>
        <div className="pol-cell">
          <div className="pol-val">3-5</div>
          <div className="pol-lbl">Working days refund</div>
          <div className="pol-note">After we receive item</div>
        </div>
        <div className="pol-cell">
          <div className="pol-val">∞</div>
          <div className="pol-lbl">Lifetime repair</div>
          <div className="pol-note">Forever, at no charge</div>
        </div>
      </div>

      <div className="main">
        <div className="portal">
          <h2 className="portal-title">Start a Return or Exchange</h2>
          <p className="portal-sub">Complete the form below and we'll email you a prepaid return label within 2 hours.</p>

          <div className="step-nav">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`sn ${step === s.id ? 'active' : ''} ${step > s.id ? 'done' : ''}`}
                onClick={() => goStep(s.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') goStep(s.id);
                }}
              >
                <div className="sn-dot">{s.id}</div>
                <span className="sn-label">{s.label}</span>
              </div>
            ))}
          </div>

          {!showSuccess && (
            <>
              <div className={`step-panel ${step === 1 ? 'active' : ''}`}>
                <div className="field-row">
                  <div className="field-g">
                    <label>Order number</label>
                    <input
                      type="text"
                      value={orderNum}
                      onChange={(event) => setOrderNum(event.target.value)}
                      placeholder="e.g. ATL-00123"
                    />
                  </div>
                  <div className="field-g">
                    <label>Email address</label>
                    <input
                      type="email"
                      value={orderEmail}
                      onChange={(event) => setOrderEmail(event.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div className="field-g">
                  <label>Which item are you returning?</label>
                  <select value={itemSel} onChange={(event) => setItemSel(event.target.value)}>
                    <option value="" disabled>
                      Select an item
                    </option>
                    {itemOptions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <h3 className="portal-subheading">What would you like to do?</h3>
                <div className="rtype-grid">
                  <button
                    type="button"
                    className={`rtype ${returnType === 'refund' ? 'sel' : ''}`}
                    onClick={() => setReturnType('refund')}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <div className="rtype-n">Full Refund</div>
                    <div className="rtype-d">
                      Return the item and receive a full refund to your original payment method.
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`rtype ${returnType === 'exchange' ? 'sel' : ''}`}
                    onClick={() => setReturnType('exchange')}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <polyline points="17 1 21 5 17 9" />
                      <path d="M3 11V9a4 4 0 014-4h14" />
                      <polyline points="7 23 3 19 7 15" />
                      <path d="M21 13v2a4 4 0 01-4 4H3" />
                    </svg>
                    <div className="rtype-n">Exchange</div>
                    <div className="rtype-d">
                      Swap for a different size or colour - we ship the replacement the same day.
                    </div>
                  </button>
                </div>

                {returnType === 'exchange' && (
                  <div className="field-row">
                    <div className="field-g">
                      <label>Exchange size</label>
                      <select value={exchangeSize} onChange={(event) => setExchangeSize(event.target.value)}>
                        {exchangeSizes.map((size) => (
                          <option key={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field-g">
                      <label>Exchange colour</label>
                      <select value={exchangeColor} onChange={(event) => setExchangeColor(event.target.value)}>
                        {exchangeColors.map((color) => (
                          <option key={color}>{color}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="step-actions">
                  <button className="btn-next" type="button" onClick={() => goStep(2)}>
                    <span>Continue -&gt;</span>
                  </button>
                </div>
              </div>

              <div className={`step-panel ${step === 2 ? 'active' : ''}`}>
                <p className="step-lead">Help us improve - why are you returning this piece?</p>
                <div className="reason-tags">
                  {reasonOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`rtag ${reason === option ? 'sel' : ''}`}
                      onClick={() => setReason(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="field-g">
                  <label>Additional comments (optional)</label>
                  <textarea
                    value={comments}
                    onChange={(event) => setComments(event.target.value)}
                    placeholder="Tell us anything else that would help - we read every note."
                  />
                </div>
                <div className="field-g">
                  <label>Condition of item</label>
                  <select value={condition} onChange={(event) => setCondition(event.target.value)}>
                    <option>Unworn, tags attached</option>
                    <option>Tried on once, tags attached</option>
                    <option>Tried on once, tags removed</option>
                    <option>Worn but in original condition</option>
                  </select>
                </div>
                <div className="step-actions">
                  <button className="btn-back" type="button" onClick={() => goStep(1)}>
                    &larr; Back
                  </button>
                  <button className="btn-next" type="button" onClick={() => goStep(3)}>
                    <span>Review Return -&gt;</span>
                  </button>
                </div>
              </div>

              <div className={`step-panel ${step === 3 ? 'active' : ''}`}>
                <p className="step-lead">Please review your return details before submitting.</p>
                <div className="confirm-box">
                  <div className="confirm-row">
                    <span>Order</span>
                    <strong>{orderNum || '-'}</strong>
                  </div>
                  <div className="confirm-row">
                    <span>Item</span>
                    <strong>{itemSel || '-'}</strong>
                  </div>
                  <div className="confirm-row">
                    <span>Return type</span>
                    <strong>{confirmType}</strong>
                  </div>
                  <div className="confirm-row">
                    <span>Return shipping</span>
                    <strong>Free - prepaid label</strong>
                  </div>
                </div>
                <div className="confirm-total">
                  <div>
                    <div className="ct-lbl">You will receive</div>
                    <div className="ct-val">{confirmAmount}</div>
                  </div>
                  <div className="ct-note">
                    Within 3-5 working days of us receiving your return.
                  </div>
                </div>
                <div className="step-actions step-actions-tight">
                  <button className="btn-back" type="button" onClick={() => goStep(2)}>
                    &larr; Back
                  </button>
                  <button className="btn-next" type="button" onClick={submitReturn}>
                    <span>Submit Return ✓</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <div className={`success-panel ${showSuccess ? 'show' : ''}`}>
            <div className="s-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="s-h">Return submitted</h2>
            <p className="s-p">
              Your prepaid return label is on its way to your inbox. You'll receive a refund confirmation once we've
              processed your item - usually within 24 hours of receipt.
            </p>
            <div className="s-ref">{successRef}</div>
            <button className="s-dl" type="button" onClick={() => showToast('Label download started')}>
              Download Return Label
            </button>
          </div>
        </div>

        <aside className="info-panel">
          <div className="tracker">
            <div className="tr-title">Track a Return</div>
            <div className="tr-input">
              <input
                type="text"
                className="tr-i"
                value={trackRef}
                onChange={(event) => setTrackRef(event.target.value)}
                placeholder="Enter return reference"
              />
              <button className="tr-btn" type="button" onClick={trackReturn}>
                Track -&gt;
              </button>
            </div>
            <div className={`tr-result ${showTracker ? 'show' : ''}`}>
              <div className="tr-steps">
                <div className="trstep done">
                  <div className="tr-dot" />
                  <div className="tr-step-n">Return submitted</div>
                  <div className="tr-step-d">Label generated - Feb 14, 2026</div>
                </div>
                <div className="trstep done">
                  <div className="tr-dot" />
                  <div className="tr-step-n">Item collected</div>
                  <div className="tr-step-d">Collected by carrier - Feb 15, 2026</div>
                </div>
                <div className="trstep active">
                  <div className="tr-dot" />
                  <div className="tr-step-n">In transit to Atelier</div>
                  <div className="tr-step-d">Est. arrival Feb 17, 2026</div>
                </div>
                <div className="trstep">
                  <div className="tr-dot" />
                  <div className="tr-step-n">Received & inspected</div>
                  <div className="tr-step-d">Pending</div>
                </div>
                <div className="trstep">
                  <div className="tr-dot" />
                  <div className="tr-step-n">Refund processed</div>
                  <div className="tr-step-d">Pending</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pol-details">
            <div className="pd-h">What we accept</div>
            <div className="pd-item">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p>
                <strong>Unworn items</strong> with original tags attached, returned within 30 days of delivery.
              </p>
            </div>
            <div className="pd-item">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p>
                <strong>Items tried on once</strong> - if you need to assess fit, that's fine. Just keep the garment
                unwashed.
              </p>
            </div>
            <div className="pd-item">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p>
                <strong>Gift returns</strong> accepted with proof of purchase. Refund goes to the original purchaser.
              </p>
            </div>
            <div className="pd-item pd-item-warning">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <p>
                <strong>We can't accept</strong> items worn, washed, altered, or returned after 30 days - except for
                our lifetime repair programme.
              </p>
            </div>
          </div>

          <div>
            <div className="faq-title">Common questions</div>
            {[
              {
                q: 'How long does a refund take?',
                a: "Once we receive your return, we inspect it within 24 hours. Your refund is then issued to your original payment method and typically appears within 3-5 working days depending on your bank.",
              },
              {
                q: 'Can I exchange for a different style?',
                a: "We can exchange for different sizes and colours within the same style. If you'd like a completely different piece, we recommend requesting a refund and placing a new order so you're not waiting.",
              },
              {
                q: 'What is the lifetime repair programme?',
                a: 'Any Atelier garment, from any season, can be returned to us for repair at no charge - forever. Worn seams, damaged buttons, a broken zip: we will fix it and return it to you. This is separate from our standard returns policy and has no time limit.',
              },
              {
                q: "I've lost my receipt. Can I still return?",
                a: "Yes. Your order email or your account order history is sufficient. If you cannot locate either, email hello@atelier.com with your name and approximate purchase date and we'll find your order.",
              },
            ].map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={item.q} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button className="faq-q" type="button" onClick={() => toggleFaq(index)}>
                    {item.q}
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <div className="faq-a">
                    <p className="faq-a-i">{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
