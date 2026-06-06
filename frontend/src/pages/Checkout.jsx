import { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiCreditCard, FiLock, FiMail, FiMapPin, FiTag, FiTruck } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import '../styles/checkout.css';

const checkoutDetailsKey = 'astravia_checkout_details';

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

const readSavedCheckoutDetails = () => {
  try {
    return JSON.parse(localStorage.getItem(checkoutDetailsKey) || '{}');
  } catch (error) {
    return {};
  }
};

const getProfileAddress = (user = {}) => {
  if (!user?.address) return {};
  if (typeof user.address === 'string') return { line1: user.address };
  return user.address;
};

const toCheckoutText = (value) => (value === undefined || value === null ? '' : String(value));

const buildCheckoutDetails = (user = {}) => {
  const saved = readSavedCheckoutDetails();
  const profileAddress = getProfileAddress(user);

  return {
    email: toCheckoutText(saved.email || user?.email),
    fullName: toCheckoutText(saved.fullName || user?.name || user?.fullName || profileAddress.fullName),
    phone: toCheckoutText(saved.phone || user?.phone || profileAddress.phone),
    line1: toCheckoutText(saved.line1 || profileAddress.line1 || profileAddress.addressLine1 || profileAddress.street),
    line2: toCheckoutText(saved.line2 || profileAddress.line2 || profileAddress.addressLine2),
    city: toCheckoutText(saved.city || profileAddress.city),
    province: toCheckoutText(saved.province || profileAddress.province || profileAddress.state),
    postalCode: toCheckoutText(saved.postalCode || profileAddress.postalCode || profileAddress.zip),
    country: toCheckoutText(saved.country || profileAddress.country || 'Sri Lanka'),
  };
};

const requiredCheckoutFields = ['email', 'fullName', 'phone', 'line1', 'city', 'province', 'country'];

export default function Checkout() {
  const { items } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const checkoutState = location.state || {};
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [coupon, setCoupon] = useState('');
  const [toast, setToast] = useState('');
  const [touchedFields, setTouchedFields] = useState({});
  const [customerDetails, setCustomerDetails] = useState(() => buildCheckoutDetails(user));

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
  const emailReady = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email.trim());
  const checkoutValid = requiredCheckoutFields.every((field) => customerDetails[field].trim()) && emailReady;

  useEffect(() => {
    if (!user) return;
    const profileDetails = buildCheckoutDetails(user);
    setCustomerDetails((current) =>
      Object.fromEntries(
        Object.entries(current).map(([key, value]) => [key, value || profileDetails[key] || (key === 'country' ? 'Sri Lanka' : '')])
      )
    );
  }, [user]);

  useEffect(() => {
    localStorage.setItem(checkoutDetailsKey, JSON.stringify(customerDetails));
  }, [customerDetails]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const applyCoupon = () => {
    showToast(coupon.trim() ? 'Coupon applied to your Astravia order.' : 'Enter a coupon or gift card code first.');
  };

  const updateCustomerDetail = (field, value) => {
    setCustomerDetails((current) => ({ ...current, [field]: value }));
  };

  const markFieldTouched = (field) => {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  };

  const isFieldInvalid = (field) => {
    if (!touchedFields[field]) return false;
    if (field === 'email') return !emailReady;
    return requiredCheckoutFields.includes(field) && !customerDetails[field].trim();
  };

  const proceedToPayment = () => {
    if (!checkoutValid) {
      setTouchedFields(Object.fromEntries(requiredCheckoutFields.map((field) => [field, true])));
      showToast('Complete required contact and shipping fields first.');
      return;
    }

    const address = {
      fullName: customerDetails.fullName.trim(),
      line1: customerDetails.line1.trim(),
      line2: customerDetails.line2.trim(),
      city: customerDetails.city.trim(),
      province: customerDetails.province.trim(),
      postalCode: customerDetails.postalCode.trim(),
      country: customerDetails.country.trim(),
      phone: customerDetails.phone.trim(),
    };

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
          customerName: address.fullName,
          customerEmail: customerDetails.email.trim(),
          phone: address.phone,
          address,
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
              <div className="checkout-field-grid">
                <label className="checkout-field">
                  <span>Email Address *</span>
                  <input
                    type="email"
                    value={customerDetails.email}
                    onBlur={() => markFieldTouched('email')}
                    onChange={(event) => updateCustomerDetail('email', event.target.value)}
                    placeholder="Enter your email address"
                    aria-invalid={isFieldInvalid('email')}
                    required
                  />
                </label>
              </div>
            </section>

            <section className="checkout-block">
              <div className="checkout-block-title">
                <FiMapPin aria-hidden="true" />
                <h2>Shipping Address</h2>
              </div>
              <div className="checkout-field-grid checkout-field-grid-two">
                <label className="checkout-field">
                  <span>Full Name *</span>
                  <input
                    type="text"
                    value={customerDetails.fullName}
                    onBlur={() => markFieldTouched('fullName')}
                    onChange={(event) => updateCustomerDetail('fullName', event.target.value)}
                    aria-invalid={isFieldInvalid('fullName')}
                    required
                  />
                </label>
                <label className="checkout-field">
                  <span>Phone Number *</span>
                  <input
                    type="tel"
                    value={customerDetails.phone}
                    onBlur={() => markFieldTouched('phone')}
                    onChange={(event) => updateCustomerDetail('phone', event.target.value)}
                    aria-invalid={isFieldInvalid('phone')}
                    required
                  />
                </label>
                <label className="checkout-field checkout-field-wide">
                  <span>Address Line 1 *</span>
                  <input
                    type="text"
                    value={customerDetails.line1}
                    onBlur={() => markFieldTouched('line1')}
                    onChange={(event) => updateCustomerDetail('line1', event.target.value)}
                    aria-invalid={isFieldInvalid('line1')}
                    required
                  />
                </label>
                <label className="checkout-field checkout-field-wide">
                  <span>Address Line 2</span>
                  <input
                    type="text"
                    value={customerDetails.line2}
                    onChange={(event) => updateCustomerDetail('line2', event.target.value)}
                  />
                </label>
                <label className="checkout-field">
                  <span>City *</span>
                  <input
                    type="text"
                    value={customerDetails.city}
                    onBlur={() => markFieldTouched('city')}
                    onChange={(event) => updateCustomerDetail('city', event.target.value)}
                    aria-invalid={isFieldInvalid('city')}
                    required
                  />
                </label>
                <label className="checkout-field">
                  <span>Province *</span>
                  <input
                    type="text"
                    value={customerDetails.province}
                    onBlur={() => markFieldTouched('province')}
                    onChange={(event) => updateCustomerDetail('province', event.target.value)}
                    aria-invalid={isFieldInvalid('province')}
                    required
                  />
                </label>
                <label className="checkout-field">
                  <span>Postal Code</span>
                  <input
                    type="text"
                    value={customerDetails.postalCode}
                    onChange={(event) => updateCustomerDetail('postalCode', event.target.value)}
                  />
                </label>
                <label className="checkout-field">
                  <span>Country *</span>
                  <select
                    value={customerDetails.country}
                    onBlur={() => markFieldTouched('country')}
                    onChange={(event) => updateCustomerDetail('country', event.target.value)}
                    aria-invalid={isFieldInvalid('country')}
                    required
                  >
                    <option value="Sri Lanka">Sri Lanka</option>
                  </select>
                </label>
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

          <button type="button" className="checkout-pay-button" onClick={proceedToPayment} disabled={!checkoutValid}>
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
