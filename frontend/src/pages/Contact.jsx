
import { useMemo, useState } from 'react';
import { FiArrowRight, FiClock, FiInstagram, FiMail, FiMapPin, FiMessageCircle, FiPackage, FiPhone, FiShield, FiTruck } from 'react-icons/fi';
import api from '../services/api.js';



import '../styles/contact.css';

const departments = ['General', 'Orders', 'Returns', 'Sizing', 'Collabs'];

const departmentSubjects = {
  General: 'General question',
  Orders: 'Order support',
  Returns: 'Returns and exchange',
  Sizing: 'Fit and sizing help',
  Collabs: 'Collaboration enquiry',
};

const contactMethods = [
  ['Email', 'support@astravia.lk', 'Replies within 4 hours', FiMail],
  ['WhatsApp', '+94 77 123 4567', 'Fast order support', FiMessageCircle],
  ['Hotline', '+94 11 245 8890', 'Mon-Sat, 10AM-7PM', FiPhone],
];

const quickHelp = [
  ['Track Order', 'Get delivery updates for your latest Astravia drop.', FiPackage],
  ['Shipping', 'Island-wide delivery, secure packaging, fast dispatch.', FiTruck],
  ['Privacy', 'Your messages and order data stay protected.', FiShield],
];

const makeRef = () => `AST-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

export default function Contact() {
  const [activeDept, setActiveDept] = useState('General');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    products: '',
    quantity: '',
    orderValue: '',
    orderRef: '',
    subject: '',
    order: '',
    subject: departmentSubjects.General,
    message: '',
  });
  const [error, setError] = useState('');
  const [successRef, setSuccessRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeSubject = useMemo(() => departmentSubjects[activeDept], [activeDept]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const selectDepartment = (dept) => {
    setActiveDept(dept);
    setForm((current) => ({ ...current, subject: departmentSubjects[dept] }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (activeDept === 'Wholesale' && !formValues.companyName.trim()) {
      triggerShake('companyName');
      return;
    }

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
    try {
      if (activeDept === 'Wholesale') {
        const response = await api.post('/bulk-orders/requests', {
          companyName: formValues.companyName,
          contactPerson: `${formValues.firstName} ${formValues.lastName}`.trim() || formValues.email,
          email: formValues.email,
          phone: formValues.phone,
          products: formValues.products,
          quantity: formValues.quantity,
          orderValue: formValues.orderValue,
          message: formValues.message,
        });
        setSuccessRef(`REF: ${response.data.id || response.data._id || generateRef()}`);
      } else {
        setSuccessRef(`REF: ${generateRef()}`);
      }
      setShowSuccess(true);
    } catch (error) {
      setSuccessRef('REF: Unable to send');
      setShowSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowSuccess(false);
    setFormValues({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      companyName: '',
      products: '',
      quantity: '',
      orderValue: '',
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
    if (!form.email.trim() || !form.message.trim()) {
      setError('Add your email and message so the Astravia team can reply.');
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      setSuccessRef(makeRef());
      setSubmitting(false);
      setForm({
        name: '',
        email: '',
        order: '',
        subject: activeSubject,
        message: '',
      });
    }, 900);
  };

  return (
    <section className="astravia-contact-page">
      <div className="contact-hero">
        <div className="contact-hero-copy">
          <p className="contact-kicker">Contact Astravia</p>
          <h1>NEED HELP?<br /><span>TALK TO US.</span></h1>
          <p className="contact-hero-text">
            Product questions, order support, sizing advice, returns, and collabs. Send it here and our team will get back fast.
          </p>
          <div className="contact-hero-actions">
            <a href="mailto:support@astravia.lk">Email Support</a>
            <a href="#contact-form">Send Message</a>
          </div>
        </div>

      </div>

      <div className="contact-method-grid">
        {contactMethods.map(([title, value, note, Icon]) => (
          <a className="contact-method-card" href={title === 'Email' ? 'mailto:support@astravia.lk' : '#contact-form'} key={title}>
            <Icon aria-hidden="true" />
            <span>{title}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </a>
        ))}
      </div>

      <div className="contact-main">
        <div className="contact-info-column">
          <div className="contact-location-card">
            <p className="contact-kicker">Visit / Pickup</p>
            <h2>Colombo Studio</h2>
            <div className="contact-address-row">
              <FiMapPin aria-hidden="true" />
              <span>Level 04, Astravia House, Colombo 03, Sri Lanka</span>
            </div>
            <div className="contact-address-row">
              <FiClock aria-hidden="true" />
              <span>Mon-Sat, 10:00 AM - 7:00 PM</span>
            </div>
            <div className="contact-map-panel">
              <iframe
                title="Astravia Colombo location map"
                src="https://www.google.com/maps?q=Astravia%20Colombo%2003%20Sri%20Lanka&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <a href="https://maps.google.com" target="_blank" rel="noreferrer">
              Open Maps <FiArrowRight aria-hidden="true" />
            </a>
          </div>

          <div className="contact-social-card">
            <p className="contact-kicker">Social</p>
            <h3>@astravia</h3>
            <p>Drop us a DM for fit checks, campaign enquiries, and quick drop questions.</p>
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              <FiInstagram aria-hidden="true" /> Instagram
            </a>
          </div>

          <div className="quick-help-grid">
            {quickHelp.map(([title, text, Icon]) => (
              <article key={title}>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="contact-form-panel" id="contact-form">
          <div className="form-heading">
            <p className="contact-kicker">Support Desk</p>
            <h2>Send A Message</h2>
            <span>Choose a department and tell us what you need. Keep it simple, we will handle the rest.</span>
          </div>

          <div className="contact-dept-tabs" aria-label="Contact department">
            {departments.map((dept) => (
              <button
                className={activeDept === dept ? 'active' : ''}
                type="button"
                key={dept}
                onClick={() => selectDepartment(dept)}
              >
                {dept}
              </button>
            ))}
          </div>

          <form className="astravia-contact-form" onSubmit={handleSubmit}>
            <div className="contact-field-row">
              <label>
                Name
                <input value={form.name} onChange={updateField('name')} placeholder="Your name" />
              </label>
              <label>
                Email
                <input type="email" value={form.email} onChange={updateField('email')} placeholder="you@email.com" />
              </label>
            </div>

            {activeDept === 'Wholesale' && (
              <>
                <div className={`float-field ${shakeFields.companyName ? 'shake' : ''}`}>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    placeholder=" "
                    value={formValues.companyName}
                    onChange={setField('companyName')}
                  />
                  <label className="float-label" htmlFor="companyName">
                    Company Name
                  </label>
                  <span className="field-line" />
                </div>

                <div className="field-row">
                  <div className="float-field">
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder=" "
                      value={formValues.phone}
                      onChange={setField('phone')}
                    />
                    <label className="float-label" htmlFor="phone">
                      Phone
                    </label>
                    <span className="field-line" />
                  </div>
                  <div className="float-field">
                    <input
                      type="number"
                      min="0"
                      id="quantity"
                      name="quantity"
                      placeholder=" "
                      value={formValues.quantity}
                      onChange={setField('quantity')}
                    />
                    <label className="float-label" htmlFor="quantity">
                      Quantity
                    </label>
                    <span className="field-line" />
                  </div>
                </div>

                <div className="field-row">
                  <div className="float-field">
                    <input
                      type="text"
                      id="products"
                      name="products"
                      placeholder=" "
                      value={formValues.products}
                      onChange={setField('products')}
                    />
                    <label className="float-label" htmlFor="products">
                      Products
                    </label>
                    <span className="field-line" />
                  </div>
                  <div className="float-field">
                    <input
                      type="number"
                      min="0"
                      id="orderValue"
                      name="orderValue"
                      placeholder=" "
                      value={formValues.orderValue}
                      onChange={setField('orderValue')}
                    />
                    <label className="float-label" htmlFor="orderValue">
                      Order Value
                    </label>
                    <span className="field-line" />
                  </div>
                </div>
              </>
            )}

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
            <div className="contact-field-row">
              <label>
                Order ID
                <input value={form.order} onChange={updateField('order')} placeholder="Optional" />
              </label>
              <label>
                Subject
                <input value={form.subject} onChange={updateField('subject')} />
              </label>
            </div>

            <label>
              Message
              <textarea value={form.message} onChange={updateField('message')} placeholder="Tell us what happened, what you need, or what you want to ask." />
            </label>

            {error && <div className="contact-error">{error}</div>}
            {successRef && <div className="contact-success">Message received. Reference {successRef}</div>}

            <button className="contact-submit-btn" type="submit" disabled={submitting}>
              <span>{submitting ? 'Sending...' : 'Send Message'}</span>
              <FiArrowRight aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
