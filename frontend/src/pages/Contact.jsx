import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/contact.css';

const subjectOptions = [
  'I have a question about a product',
  'I need help with my order',
  "I'd like to discuss a return",
  "I'm interested in styling advice",
  'Press or media enquiry',
  'Wholesale or stockist enquiry',
  'Something else',
];

const deptOptions = ['General', 'Orders', 'Returns', 'Styling', 'Press', 'Wholesale'];

const deptToSubject = {
  General: '',
  Orders: subjectOptions[1],
  Returns: subjectOptions[2],
  Styling: subjectOptions[3],
  Press: subjectOptions[4],
  Wholesale: subjectOptions[5],
};

const hours = [
  { day: 'Monday', open: '10:00', close: '18:00' },
  { day: 'Tuesday', open: '10:00', close: '18:00' },
  { day: 'Wednesday', open: '10:00', close: '18:00' },
  { day: 'Thursday', open: '10:00', close: '20:00' },
  { day: 'Friday', open: '10:00', close: '18:00' },
  { day: 'Saturday', open: '10:00', close: '17:00' },
  { day: 'Sunday', open: null, close: null },
];

const marqueeItems = [
  'Handcrafted in Paris',
  'Est. 2014',
  'Every message read personally',
  'We reply within 4 hours',
  'Lifetime repair guarantee',
  'Sustainable - Artisan - Timeless',
];

const generateRef = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let ref = 'ATL-';
  for (let i = 0; i < 8; i += 1) {
    if (i === 4) ref += '-';
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return ref;
};

export default function Contact() {
  const [activeDept, setActiveDept] = useState('General');
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    orderRef: '',
    subject: '',
    message: '',
  });
  const [orderRefOn, setOrderRefOn] = useState(false);
  const [consented, setConsented] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [fileLabel, setFileLabel] = useState('Attach a photo or document');
  const [shakeFields, setShakeFields] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successRef, setSuccessRef] = useState('REF: ATL-0000');
  const timeoutsRef = useRef([]);
  const fileInputRef = useRef(null);
  const cursorRef = useRef(null);
  const cursorRingRef = useRef(null);
  const contactRef = useRef(null);

  const todayIndex = useMemo(() => (new Date().getDay() + 6) % 7, []);
  const marqueeLoop = useMemo(() => [...marqueeItems, ...marqueeItems], []);

  useEffect(() => {
    const cursor = cursorRef.current;
    const ring = cursorRingRef.current;
    const container = contactRef.current;
    if (!cursor || !ring || !container) return undefined;

    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;
    let rafId = 0;

    const onMove = (event) => {
      mx = event.clientX;
      my = event.clientY;
      cursor.style.left = `${mx}px`;
      cursor.style.top = `${my}px`;
    };

    const animateRing = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;
      rafId = requestAnimationFrame(animateRing);
    };

    const showCursor = () => {
      cursor.classList.remove('hidden');
      ring.classList.remove('hidden');
    };

    const hideCursor = () => {
      cursor.classList.add('hidden');
      ring.classList.add('hidden');
    };

    hideCursor();
    animateRing();
    window.addEventListener('mousemove', onMove);
    container.addEventListener('mouseenter', showCursor);
    container.addEventListener('mouseleave', hideCursor);

    const hoverTargets = container.querySelectorAll(
      'a, button, .dept-btn, .consent-check, .toggle-switch, .attach-area, .social-link, .contact-method'
    );
    const hoverOn = () => {
      cursor.classList.add('hover');
      ring.classList.add('hover');
    };
    const hoverOff = () => {
      cursor.classList.remove('hover');
      ring.classList.remove('hover');
    };
    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', hoverOn);
      el.addEventListener('mouseleave', hoverOff);
    });

    return () => {
      window.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseenter', showCursor);
      container.removeEventListener('mouseleave', hideCursor);
      hoverTargets.forEach((el) => {
        el.removeEventListener('mouseenter', hoverOn);
        el.removeEventListener('mouseleave', hoverOff);
      });
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => () => {
    timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutsRef.current = [];
  }, []);

  const setField = (field) => (event) => {
    const { value } = event.target;
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const triggerShake = (field) => {
    setShakeFields((prev) => ({ ...prev, [field]: true }));
    const timeoutId = setTimeout(() => {
      setShakeFields((prev) => ({ ...prev, [field]: false }));
    }, 450);
    timeoutsRef.current.push(timeoutId);
  };

  const handleDeptChange = (dept) => {
    setActiveDept(dept);
    const mappedSubject = deptToSubject[dept] ?? '';
    setFormValues((prev) => ({ ...prev, subject: mappedSubject }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setFileLabel(file ? file.name : 'Attach a photo or document');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!formValues.email.trim()) {
      triggerShake('email');
      return;
    }

    if (!formValues.message.trim()) {
      triggerShake('message');
      return;
    }

    if (!consented) {
      setConsentError(true);
      const timeoutId = setTimeout(() => setConsentError(false), 1500);
      timeoutsRef.current.push(timeoutId);
      return;
    }

    setIsSubmitting(true);
    const timeoutId = setTimeout(() => {
      setSuccessRef(`REF: ${generateRef()}`);
      setShowSuccess(true);
      setIsSubmitting(false);
    }, 1400);
    timeoutsRef.current.push(timeoutId);
  };

  const resetForm = () => {
    setShowSuccess(false);
    setFormValues({
      firstName: '',
      lastName: '',
      email: '',
      orderRef: '',
      subject: '',
      message: '',
    });
    setActiveDept('General');
    setFileLabel('Attach a photo or document');
    setConsented(false);
    setConsentError(false);
    setOrderRefOn(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="contact-page" ref={contactRef}>
      <div className="cursor hidden" ref={cursorRef} />
      <div className="cursor-ring hidden" ref={cursorRingRef} />

      <section className="hero-band">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-eyebrow">We&apos;re here for you</div>
            <h1 className="hero-title">
              Let&apos;s
              <br />
              <em>talk</em>
            </h1>
          </div>
          <div className="hero-right">
            <p className="hero-desc">
              Whether you have a question about sizing, a collaboration idea, or simply want to know more about how
              your garment was made - we read every message personally.
            </p>
            <div className="response-promise">
              <div className="promise-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <p className="promise-text">
                <strong>We reply within 4 hours</strong> during atelier hours, and by 10am the next morning for
                messages sent overnight.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="main-grid">
        <div className="form-panel">
          <div className="dept-label">What can we help with?</div>
          <div className="dept-grid">
            {deptOptions.map((dept) => (
              <button
                key={dept}
                type="button"
                className={`dept-btn ${activeDept === dept ? 'active' : ''}`}
                data-dept={dept}
                onClick={() => handleDeptChange(dept)}
              >
                <span className="dept-btn-text">{dept}</span>
              </button>
            ))}
          </div>

          <form className="form-fields" onSubmit={handleSubmit}>
            <div className="field-row">
              <div className="float-field">
                <input
                  type="text"
                  id="fname"
                  name="firstName"
                  placeholder=" "
                  value={formValues.firstName}
                  onChange={setField('firstName')}
                />
                <label className="float-label" htmlFor="fname">
                  First Name
                </label>
                <span className="field-line" />
              </div>
              <div className="float-field">
                <input
                  type="text"
                  id="lname"
                  name="lastName"
                  placeholder=" "
                  value={formValues.lastName}
                  onChange={setField('lastName')}
                />
                <label className="float-label" htmlFor="lname">
                  Last Name
                </label>
                <span className="field-line" />
              </div>
            </div>

            <div className={`float-field ${shakeFields.email ? 'shake' : ''}`}>
              <input
                type="email"
                id="email"
                name="email"
                placeholder=" "
                value={formValues.email}
                onChange={setField('email')}
              />
              <label className="float-label" htmlFor="email">
                Email Address
              </label>
              <span className="field-line" />
            </div>

            <div>
              <button type="button" className="order-ref-toggle" onClick={() => setOrderRefOn((prev) => !prev)}>
                <span className={`toggle-switch ${orderRefOn ? 'on' : ''}`} />
                <span className="toggle-label">Include an order reference</span>
              </button>
              {orderRefOn && (
                <div style={{ marginTop: '1rem' }}>
                  <div className="float-field">
                    <input
                      type="text"
                      id="orderRef"
                      name="orderRef"
                      placeholder=" "
                      value={formValues.orderRef}
                      onChange={setField('orderRef')}
                    />
                    <label className="float-label" htmlFor="orderRef">
                      Order Reference
                    </label>
                    <span className="field-line" />
                  </div>
                </div>
              )}
            </div>

            <div className={`float-field ${formValues.subject ? 'filled' : ''}`}>
              <select id="subject" name="subject" value={formValues.subject} onChange={setField('subject')}>
                <option value="" disabled hidden />
                {subjectOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <label className="float-label" htmlFor="subject">
                Subject
              </label>
              <span className="field-line" />
            </div>

            <div className={`float-field ${shakeFields.message ? 'shake' : ''}`}>
              <textarea
                id="message"
                name="message"
                placeholder=" "
                value={formValues.message}
                onChange={setField('message')}
              />
              <label className="float-label" htmlFor="message">
                Your Message
              </label>
              <span className="field-line" />
            </div>

            <label className="attach-area">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
              <div className="attach-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
              </div>
              <div className="attach-text">{fileLabel}</div>
              <div className="attach-sub">JPG, PNG or PDF - Max 10MB</div>
            </label>

            <div className="consent-row">
              <button
                type="button"
                className={`consent-check ${consented ? 'checked' : ''} ${consentError ? 'error' : ''}`}
                onClick={() => setConsented((prev) => !prev)}
                aria-pressed={consented}
              />
              <p className="consent-text">
                I agree to Atelier storing my message and contact details in accordance with their{' '}
                <a href="#">Privacy Policy</a>.
              </p>
            </div>

            <div className="submit-row">
              <button className="submit-btn" type="submit" disabled={isSubmitting}>
                <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
              </button>
              <p className="submit-note">Your message goes directly to our team - not a chatbot.</p>
            </div>
          </form>

          <div className={`success-overlay ${showSuccess ? 'show' : ''}`}>
            <div className="success-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="success-title">Message received</h2>
            <p className="success-sub">
              Thank you - your message has been passed to our team. You&apos;ll hear back within 4 hours during
              atelier hours.
            </p>
            <div className="success-ref">{successRef}</div>
            <button className="success-back" type="button" onClick={resetForm}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Send another message
            </button>
          </div>
        </div>

        <aside className="info-panel">
          <div className="map-block">
            <div className="map-pin">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <div className="map-pin-label">Atelier Paris</div>
            </div>
            <a href="#" className="map-directions">
              Directions
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          </div>

          <div className="contact-details">
            <div className="detail-section">
              <div className="detail-heading">Our Atelier</div>
              <div className="address-block">
                <div className="address-line">
                  <span>Street</span>
                  14 Rue du Faubourg Saint-Honore
                </div>
                <div className="address-line">
                  <span>City</span>
                  Paris, 75008
                </div>
                <div className="address-line">
                  <span>Country</span>
                  France
                </div>
                <div className="address-line">
                  <span>Nearest Metro</span>
                  Concorde - Line 1
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-heading">Reach Us Directly</div>
              <div className="contact-methods">
                <a href="mailto:hello@atelier.com" className="contact-method">
                  <div className="method-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <polyline points="22,4 12,13 2,4" />
                    </svg>
                  </div>
                  <div className="method-info">
                    <div className="method-label">Email</div>
                    <div className="method-val">hello@atelier.com</div>
                    <div className="method-note">Replies within 4 hours</div>
                  </div>
                </a>
                <a href="tel:+33140001234" className="contact-method">
                  <div className="method-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </div>
                  <div className="method-info">
                    <div className="method-label">Phone</div>
                    <div className="method-val">+33 1 40 00 12 34</div>
                    <div className="method-note">Mon-Sat, 10am-6pm CET</div>
                  </div>
                </a>
                <a href="#" className="contact-method">
                  <div className="method-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <div className="method-info">
                    <div className="method-label">Live Chat</div>
                    <div className="method-val">Start a conversation</div>
                    <div className="method-note">Available during atelier hours</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-heading">Atelier Hours</div>
              <div className="hours-table">
                {hours.map((slot, index) => {
                  const isToday = index === todayIndex;
                  return (
                    <div className="hours-row" key={slot.day}>
                      <span className={`hours-day ${isToday ? 'today' : ''}`}>
                        {slot.day}
                        {isToday && <span className="today-badge">Today</span>}
                      </span>
                      {slot.open ? (
                        <span className="hours-time">
                          {slot.open} - {slot.close}
                        </span>
                      ) : (
                        <span className="hours-closed">Closed</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-heading">Follow the Atelier</div>
              <div className="social-row">
                <a href="#" className="social-link" title="Instagram">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
                <a href="#" className="social-link" title="Pinterest">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.04-2.83.18-.77 1.22-5.17 1.22-5.17s-.31-.63-.31-1.56c0-1.46.85-2.56 1.9-2.56.9 0 1.33.67 1.33 1.48 0 .9-.58 2.26-.87 3.51-.25 1.05.52 1.9 1.54 1.9 1.84 0 3.08-2.35 3.08-5.13 0-2.11-1.43-3.59-3.47-3.59-2.36 0-3.74 1.77-3.74 3.59 0 .71.27 1.48.62 1.9.07.08.08.15.06.23-.06.26-.2.82-.23.94-.04.15-.13.18-.3.11-1.13-.52-1.83-2.17-1.83-3.49 0-2.84 2.06-5.44 5.94-5.44 3.12 0 5.54 2.22 5.54 5.19 0 3.09-1.95 5.57-4.65 5.57-.91 0-1.76-.47-2.05-1.03l-.56 2.08c-.2.78-.75 1.75-1.12 2.34.85.26 1.74.4 2.67.4 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
                  </svg>
                </a>
                <a href="#" className="social-link" title="Twitter / X">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </a>
                <a href="#" className="social-link" title="LinkedIn">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="bottom-marquee" aria-hidden="true">
        <div className="bm-inner">
          {marqueeLoop.map((item, index) => (
            <span key={`${item}-${index}`} className="bm-item">
              {item}
              <span className="bm-dot" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
