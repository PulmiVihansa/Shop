import { useMemo, useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiCreditCard, FiLock, FiMail, FiMapPin, FiTag, FiTruck } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import '../styles/checkout.css';

const fallbackItems = [
  {
    productId: 'chaos-tee',
    name: 'Chaos Tee',
    image: '/models/Tshirt8.png',
    color: 'Black',
    size: 'M',
    quantity: 1,
    price: 2490,
    oldPrice: 4990,
  },
  {
    productId: 'rebuild-tee',
    name: 'Rebuild Tee',
    image: '/models/Tshirt5.png',
    color: 'Stone',
    size: 'M',
    quantity: 1,
    price: 2145,
    oldPrice: 4290,
  },
  {
    productId: 'phantom-tee',
    name: 'Phantom Tee',
    image: '/models/Tshirt11.png',
    color: 'Black',
    size: 'L',
    quantity: 1,
    price: 3056,
    oldPrice: 4690,
  },
];

const formatPrice = (value) => `Rs. ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Checkout() {
  const { items } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const checkoutState = location.state || {};
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [coupon, setCoupon] = useState('');
  const [toast, setToast] = useState('');

  const checkoutItems = useMemo(() => {
    if (checkoutState.items?.length) return checkoutState.items;
    if (!items.length) return fallbackItems;
    return items.map((item) => ({
      ...item,
      color: item.color || 'Black',
      oldPrice: item.oldPrice || Math.round(Number(item.price || 0) * 1.35),
    }));
  }, [checkoutState.items, items]);

  const subtotal = checkoutItems.reduce((total, item) => total + Number(item.price || 0) * (item.quantity || 1), 0);
  const shipping = shippingMethod === 'standard' ? 250 : 550;
  const discount = Math.round(subtotal * 0.2);
  const total = subtotal + shipping - discount;

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const applyCoupon = () => {
    showToast(coupon.trim() ? 'Coupon applied to your Astravia order.' : 'Enter a coupon or gift card code first.');
  };

  const proceedToPayment = () => {
    showToast('Checkout validated. Proceeding to secure payment.');
    window.setTimeout(() => {
      navigate('/payment', {
        state: {
          items: checkoutItems,
          subtotal,
          shipping,
          discount,
          total,
          shippingMethod,
          paymentMethod,
        },
      });
    }, 450);
  };

  return (
    <section className="astravia-checkout-page">
      <div className="checkout-steps" aria-label="Checkout progress">
        {[
          ['01.', 'Cart'],
          ['02.', 'Checkout'],
          ['03.', 'Payment'],
          ['04.', 'Confirmation'],
        ].map(([number, label], index) => (
          <div className={label === 'Checkout' ? 'active' : ''} key={label}>
            <span>{number}</span>
            {label}
            {index < 3 && <i aria-hidden="true" />}
          </div>
        ))}
      </div>

      <div className="checkout-container">
        <div className="checkout-left">
          <div className="checkout-title-row checkout-fade-card">
            <h1>Checkout</h1>
            <div>
              <FiLock aria-hidden="true" />
              <span>Secure Checkout</span>
              <p>Your information is 100% protected</p>
            </div>
          </div>

          <div className="checkout-info-panel checkout-fade-card">
            <section className="checkout-block">
              <div className="checkout-block-title">
                <FiMail aria-hidden="true" />
                <h2>Contact Information</h2>
              </div>
              <div className="checkout-display-row">
                <FiMail aria-hidden="true" />
                <span>yourmail@gmail.com</span>
                <button type="button">Edit</button>
              </div>
            </section>

            <section className="checkout-block">
              <div className="checkout-block-title">
                <FiMapPin aria-hidden="true" />
                <h2>Shipping Address</h2>
              </div>
              <div className="checkout-address-box">
                <div>
                  <p>Ravindu Perera</p>
                  <p>123, Galle Road</p>
                  <p>Colombo 04, Western Province</p>
                  <p>Sri Lanka</p>
                  <p>+94 77 123 4567</p>
                </div>
                <button type="button">Edit</button>
              </div>
            </section>

            <section className="checkout-block">
              <div className="checkout-block-title">
                <FiTruck aria-hidden="true" />
                <h2>Shipping Method</h2>
              </div>
              <div className="checkout-option-list">
                {[
                  ['standard', 'Standard Shipping', '3-5 Business Days', 250],
                  ['express', 'Express Shipping', '1-2 Business Days', 550],
                ].map(([key, title, note, price]) => (
                  <button
                    type="button"
                    className={shippingMethod === key ? 'selected' : ''}
                    key={key}
                    onClick={() => setShippingMethod(key)}
                  >
                    <span className="checkout-radio" />
                    <span>
                      <strong>{title}</strong>
                      <em>{note}</em>
                    </span>
                    <b>{formatPrice(price)}</b>
                  </button>
                ))}
              </div>
            </section>

            <section className="checkout-block">
              <div className="checkout-block-title">
                <FiCreditCard aria-hidden="true" />
                <h2>Payment Method</h2>
              </div>
              <div className="checkout-payment-grid">
                {[
                  ['card', 'Credit / Debit Card', <FiCreditCard aria-hidden="true" />],
                  ['cod', 'Cash on Delivery', <FiTag aria-hidden="true" />],
                ].map(([key, label, icon]) => (
                  <button
                    type="button"
                    className={paymentMethod === key ? 'selected' : ''}
                    key={key}
                    onClick={() => setPaymentMethod(key)}
                  >
                    <span className="checkout-radio" />
                    {icon}
                    <strong>{label}</strong>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        <aside className="checkout-summary-card checkout-fade-card">
          <div className="checkout-summary-head">
            <h2>Order Summary</h2>
            <Link to="/collection">
              <FiArrowLeft aria-hidden="true" />
              Return to Cart
            </Link>
          </div>

          <div className="checkout-products">
            {checkoutItems.map((item) => (
              <div className="checkout-product-row" key={`${item.productId}-${item.size || 'M'}`}>
                <div className="checkout-product-thumb">
                  {item.image ? <img src={item.image} alt={item.name} /> : <span>{item.name}</span>}
                </div>
                <div className="checkout-product-meta">
                  <h3>{item.name}</h3>
                  <p>{item.color || 'Black'} / Oversized / {item.size || 'M'}</p>
                  <span>Qty: {item.quantity || 1}</span>
                </div>
                <div className="checkout-product-price">
                  <strong>{formatPrice(Number(item.price || 0) * (item.quantity || 1))}</strong>
                  <del>{formatPrice(Number(item.oldPrice || 0) * (item.quantity || 1))}</del>
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-summary-lines">
            <p><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></p>
            <p><span>Shipping</span><strong>{formatPrice(shipping)}</strong></p>
            <p><span>Discount</span><strong className="discount">- {formatPrice(discount)}</strong></p>
          </div>

          <div className="checkout-total-line">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>

          <div className="checkout-coupon-row">
            <label>
              <FiTag aria-hidden="true" />
              <input
                type="text"
                value={coupon}
                onChange={(event) => setCoupon(event.target.value)}
                placeholder="Enter coupon or gift card"
              />
            </label>
            <button type="button" onClick={applyCoupon}>Apply</button>
          </div>

          <button type="button" className="checkout-pay-button" onClick={proceedToPayment}>
            Proceed To Payment
            <FiArrowRight aria-hidden="true" />
          </button>

          <div className="checkout-security-note">
            <FiLock aria-hidden="true" />
            Secure 256-bit SSL encrypted payment
          </div>
        </aside>
      </div>

      {toast && <div className="checkout-toast">{toast}</div>}
    </section>
  );
}
