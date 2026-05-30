import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import api, { getErrorMessage } from '../services/api.js';
import '../styles/checkout.css';

const formatCurrency = (value) => `LKR${Number(value || 0).toLocaleString()}`;

export default function Checkout() {
  const { items, summary, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState('shipping');
  const [shipping, setShipping] = useState({
    fullName: '',
    line1: '',
    line2: '',
    city: '',
    postalCode: '',
    country: 'Sri Lanka',
    phone: '',
  });
  const [payment, setPayment] = useState({
    method: 'ONLINE',
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    saveCard: true,
  });
  const [paymentSettings, setPaymentSettings] = useState({
    enableCOD: true,
    enableOnlinePayment: true,
    currency: 'LKR',
    paymentProvider: 'PayHere',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const delivery = summary.subtotal > 25000 || summary.subtotal === 0 ? 0 : 650;
  useEffect(() => {
    let active = true;

    async function loadPaymentSettings() {
      try {
        const response = await api.get('/settings/payment');
        if (!active) return;
        setPaymentSettings(response.data);
        if (!response.data.enableOnlinePayment && response.data.enableCOD) {
          setPayment((prev) => ({ ...prev, method: 'COD' }));
        }
        if (response.data.enableOnlinePayment && !response.data.enableCOD) {
          setPayment((prev) => ({ ...prev, method: 'ONLINE' }));
        }
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      }
    }

    loadPaymentSettings();

    return () => {
      active = false;
    };
  }, []);

  const serviceFee = payment.method === 'COD' ? 250 : 0;
  const total = summary.subtotal + delivery + serviceFee;

  const maskedCard = useMemo(() => {
    const digits = payment.cardNumber.replace(/\D/g, '');
    return digits ? `•••• ${digits.slice(-4).padStart(4, '•')}` : '•••• 4242';
  }, [payment.cardNumber]);

  const handleShippingChange = (event) => {
    setShipping((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handlePaymentChange = (event) => {
    const { name, value, type, checked } = event.target;
    setPayment((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validateShipping = () => {
    if (!shipping.fullName || !shipping.line1 || !shipping.city || !shipping.postalCode || !shipping.phone) {
      setError('Please complete all required shipping details.');
      return false;
    }
    return true;
  };

  const validatePayment = () => {
    if (payment.method !== 'ONLINE') return true;
    const digits = payment.cardNumber.replace(/\D/g, '');
    if (!payment.cardName || digits.length < 12 || !payment.expiry || !payment.cvc) {
      setError('Please complete your card details.');
      return false;
    }
    return true;
  };

  const continueToPayment = (event) => {
    event.preventDefault();
    setError('');
    if (validateShipping()) setStep('payment');
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    setError('');
    if (!validatePayment()) return;
    setSubmitting(true);

    try {
      const response = await api.post('/orders', {
        items,
        address: shipping,
        customerName: shipping.fullName,
        phone: shipping.phone,
        shippingCost: delivery + serviceFee,
        totalAmount: total,
        payment: {
          method: payment.method,
          reference: `ATL-PAY-${Date.now().toString(36).toUpperCase()}`,
          transactionId: payment.method === 'ONLINE' ? `SIM-${Date.now().toString(36).toUpperCase()}` : '',
        },
      });
      clearCart();
      navigate('/order-success', { state: { order: response.data } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <section className="checkout-page empty">
        <div>
          <span className="checkout-eyebrow">Secure Checkout</span>
          <h1>Your bag is empty</h1>
          <p>Add pieces to your bag before opening the payment portal.</p>
          <Link to="/men-new-arrivals" className="checkout-primary">Continue Shopping</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-page">
      <header className="checkout-hero">
        <div>
          <span className="checkout-eyebrow">ATELIER Payment Portal</span>
          <h1>Secure Checkout</h1>
          <p>Complete delivery and payment details for your order.</p>
        </div>
        <div className="checkout-progress" aria-label="Checkout progress">
          <span className={step === 'shipping' ? 'active' : ''}>Shipping</span>
          <i />
          <span className={step === 'payment' ? 'active' : ''}>Payment</span>
        </div>
      </header>

      {error && <div className="checkout-alert">{error}</div>}

      <div className="checkout-layout">
        <main className="checkout-panel">
          {step === 'shipping' ? (
            <form className="checkout-form" onSubmit={continueToPayment}>
              <div className="checkout-section-head">
                <span>01</span>
                <h2>Delivery Details</h2>
              </div>
              <div className="checkout-fields">
                <label>Full name<input name="fullName" value={shipping.fullName} onChange={handleShippingChange} /></label>
                <label>Phone<input name="phone" value={shipping.phone} onChange={handleShippingChange} placeholder="+94 77 000 0000" /></label>
                <label className="wide">Address line 1<input name="line1" value={shipping.line1} onChange={handleShippingChange} /></label>
                <label className="wide">Address line 2<input name="line2" value={shipping.line2} onChange={handleShippingChange} /></label>
                <label>City<input name="city" value={shipping.city} onChange={handleShippingChange} /></label>
                <label>Postal code<input name="postalCode" value={shipping.postalCode} onChange={handleShippingChange} /></label>
                <label className="wide">Country<input name="country" value={shipping.country} onChange={handleShippingChange} /></label>
              </div>
              <button className="checkout-primary" type="submit">Continue to Payment</button>
            </form>
          ) : (
            <form className="checkout-form" onSubmit={submitOrder}>
              <div className="checkout-section-head">
                <span>02</span>
                <h2>Payment Method</h2>
              </div>

              <div className="payment-methods">
                {[
                  paymentSettings.enableOnlinePayment ? ['ONLINE', `${paymentSettings.paymentProvider || 'Online'} Payment`, 'Secure online payment'] : null,
                  paymentSettings.enableCOD ? ['COD', 'Cash on Delivery', 'Pay at delivery'] : null,
                ].filter(Boolean).map(([key, title, note]) => (
                  <button
                    key={key}
                    type="button"
                    className={payment.method === key ? 'selected' : ''}
                    onClick={() => setPayment((prev) => ({ ...prev, method: key }))}
                  >
                    <strong>{title}</strong>
                    <span>{note}</span>
                  </button>
                ))}
              </div>

              {payment.method === 'ONLINE' && (
                <div className="payment-card-area">
                  <div className="checkout-card-preview">
                    <span>ATELIER</span>
                    <strong>{maskedCard}</strong>
                    <small>{payment.cardName || 'CARD HOLDER'}</small>
                  </div>
                  <div className="checkout-fields">
                    <label className="wide">Name on card<input name="cardName" value={payment.cardName} onChange={handlePaymentChange} /></label>
                    <label className="wide">Card number<input name="cardNumber" value={payment.cardNumber} onChange={handlePaymentChange} placeholder="4242 4242 4242 4242" /></label>
                    <label>Expiry<input name="expiry" value={payment.expiry} onChange={handlePaymentChange} placeholder="MM/YY" /></label>
                    <label>CVC<input name="cvc" value={payment.cvc} onChange={handlePaymentChange} placeholder="123" /></label>
                    <label className="checkout-check"><input type="checkbox" name="saveCard" checked={payment.saveCard} onChange={handlePaymentChange} /> Save card for future orders</label>
                  </div>
                </div>
              )}

              {payment.method === 'COD' && (
                <div className="checkout-note">
                  <strong>Cash on Delivery</strong>
                  <p>A small handling fee is added. Please keep the exact amount ready at delivery.</p>
                </div>
              )}

              <div className="checkout-actions">
                <button className="checkout-secondary" type="button" onClick={() => setStep('shipping')}>Back</button>
                <button className="checkout-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Processing...' : `Pay ${formatCurrency(total)}`}
                </button>
              </div>
            </form>
          )}
        </main>

        <aside className="checkout-summary">
          <div className="checkout-section-head">
            <span>Bag</span>
            <h2>Order Summary</h2>
          </div>
          <div className="checkout-items">
            {items.map((item) => (
              <div className="checkout-item" key={`${item.productId}-${item.size || 'One Size'}`}>
                <div className="checkout-item-img">
                  {item.image ? <img src={item.image} alt={item.name} /> : <span>{item.name}</span>}
                </div>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.size || 'One Size'} · Qty {item.quantity || 1}</span>
                </div>
                <p>{formatCurrency(item.price * (item.quantity || 1))}</p>
              </div>
            ))}
          </div>
          <div className="checkout-totals">
            <p><span>Subtotal</span><strong>{formatCurrency(summary.subtotal)}</strong></p>
            <p><span>Delivery</span><strong>{delivery ? formatCurrency(delivery) : 'Free'}</strong></p>
            <p><span>Service fee</span><strong>{serviceFee ? formatCurrency(serviceFee) : 'LKR0'}</strong></p>
            <p className="total"><span>Total</span><strong>{formatCurrency(total)}</strong></p>
          </div>
          <div className="checkout-secure">
            <strong>Secure payment</strong>
            <span>Payment details are never stored as raw card data.</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
