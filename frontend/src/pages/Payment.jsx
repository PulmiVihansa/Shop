import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiArrowLeft, FiArrowRight, FiCheck, FiCreditCard, FiLock, FiShield, FiSmartphone, FiTruck } from 'react-icons/fi';
import api, { getErrorMessage } from '../services/api.js';
import { fetchProducts, productsQueryDefaults } from '../services/productsQueries.js';
import { salesProductsQuery } from '../services/salesQueries.js';
import { isSaleItem, itemMetaText, pricingTotals, resolvePricedItems } from '../utils/pricing.js';
import '../styles/payment.css';

const formatPrice = (value) => `Rs. ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const checkout = location.state || {};
  const isVoucherPayment = checkout.orderType === 'voucher' || checkout.cardOnly;
  const [method, setMethod] = useState(isVoucherPayment ? 'card' : checkout.paymentMethod === 'cod' ? 'cod' : 'card');
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvc: '' });
  const [saveCard, setSaveCard] = useState(true);
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const productsQuery = useQuery({
    queryKey: ['products', 'payment-pricing'],
    queryFn: () => fetchProducts({ source: 'payment-pricing', limit: 500 }),
    enabled: !isVoucherPayment,
    ...productsQueryDefaults,
  });
  const salesQuery = useQuery({
    ...salesProductsQuery,
    enabled: !isVoucherPayment,
  });

  const items = isVoucherPayment
    ? (checkout.items || [])
    : resolvePricedItems(checkout.items || [], productsQuery.data || [], salesQuery.data || []);
  const shipping = checkout.shipping ?? (isVoucherPayment ? 0 : 250);
  const totals = pricingTotals(items, shipping);
  const subtotal = isVoucherPayment ? Number(checkout.subtotal || 0) : totals.subtotal;
  const discount = isVoucherPayment ? 0 : totals.discount;
  const total = isVoucherPayment ? Number(checkout.total || subtotal + shipping) : totals.total;
  const pricingReady = isVoucherPayment || (!productsQuery.isLoading && !salesQuery.isLoading);

  const maskedCard = useMemo(() => {
    const digits = card.number.replace(/\D/g, '');
    if (!digits) return '••••  ••••  ••••  2026';
    return `••••  ••••  ••••  ${digits.slice(-4).padStart(4, '•')}`;
  }, [card.number]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const submitPayHereForm = ({ gatewayUrl, fields }) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = gatewayUrl;
    form.style.display = 'none';
    Object.entries(fields || {}).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value ?? '';
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  const buildOrderPayload = () => ({
    orderType: isVoucherPayment ? 'voucher' : checkout.orderType,
    items,
    subtotal,
    shippingCost: shipping,
    discount,
    totalAmount: total,
    paymentMethod: method === 'cod' ? 'COD' : 'ONLINE',
    customerName: checkout.customerName || 'Ravindu Perera',
    customerEmail: checkout.customerEmail || 'yourmail@gmail.com',
    phone: checkout.phone || '+94 77 123 4567',
    voucher: isVoucherPayment ? checkout.voucher : undefined,
    address: checkout.address || {
      fullName: checkout.customerName || 'Ravindu Perera',
      line1: '123, Galle Road',
      city: 'Colombo 04',
      province: 'Western Province',
      country: 'Sri Lanka',
      phone: checkout.phone || '+94 77 123 4567',
    },
  });

  const confirmPayment = async () => {
    if (submitting) return;
    if (!pricingReady) {
      showToast('Refreshing product prices. Try again in a moment.');
      return;
    }
    if (!isVoucherPayment && !items.length) {
      showToast('Add a product before payment.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildOrderPayload();
      if (method === 'cod') {
        const response = await api.post('/orders', payload);
        navigate('/order-success', {
          state: {
            order: {
              ...response.data,
              voucher: checkout.voucher,
              orderType: isVoucherPayment ? 'voucher' : 'product',
              shipping: isVoucherPayment ? 'digital voucher' : checkout.shippingMethod || 'standard',
            },
          },
        });
        return;
      }

      const response = await api.post('/payments/create', payload);
      submitPayHereForm(response.data);
    } catch (error) {
      showToast(getErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <section className="astravia-payment-page">
      <div className="payment-steps" aria-label="Checkout progress">
        {[
          ['01.', 'Cart'],
          ['02.', 'Checkout'],
          ['03.', 'Payment'],
          ['04.', 'Confirmation'],
        ].map(([number, label], index) => (
          <div className={label === 'Payment' ? 'active' : ''} key={label}>
            <span>{number}</span>
            {label}
            {index < 3 && <i aria-hidden="true" />}
          </div>
        ))}
      </div>

      <div className="payment-shell">
        <main className="payment-main">
          <div className="payment-title-block payment-animate">
            <span>Secure Payment</span>
            <h1>{isVoucherPayment ? 'Gift It Securely.' : 'Complete The Drop.'}</h1>
            <p>
              {isVoucherPayment
                ? 'Complete your Astravia gift voucher purchase with secure card payment only.'
                : 'Choose your payment method and lock in your Astravia order through a secure encrypted checkout.'}
            </p>
          </div>

          <div className="payment-terminal payment-animate">
            <div className="payment-terminal-head">
              <div>
                <span>Payment Method</span>
                <h2>{isVoucherPayment ? 'Card Payment Only' : 'Select Payment Type'}</h2>
              </div>
              <FiLock aria-hidden="true" />
            </div>

            <div className={`payment-method-grid ${isVoucherPayment ? 'voucher-card-only' : ''}`}>
              <button type="button" className={method === 'card' ? 'active' : ''} onClick={() => setMethod('card')}>
                <FiCreditCard aria-hidden="true" />
                <strong>Credit / Debit Card</strong>
                <span>Visa, Mastercard, Amex</span>
              </button>
              {!isVoucherPayment && (
                <button type="button" className={method === 'cod' ? 'active' : ''} onClick={() => setMethod('cod')}>
                  <FiTruck aria-hidden="true" />
                  <strong>Cash On Delivery</strong>
                  <span>Pay when your order arrives</span>
                </button>
              )}
            </div>

            {method === 'card' ? (
              <div className="payment-card-layout">
                <div className="payment-card-preview">
                  <div className="card-red-orbit" aria-hidden="true" />
                  <span>ASTRAVIA BLACK CARD</span>
                  <strong>{maskedCard}</strong>
                  <div>
                    <p>{card.name || 'CARD HOLDER'}</p>
                    <p>{card.expiry || 'MM/YY'}</p>
                  </div>
                </div>

                <form className="payment-card-form">
                  <label>
                    Name On Card
                    <input
                      value={card.name}
                      onChange={(event) => setCard((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Ravindu Perera"
                    />
                  </label>
                  <label>
                    Card Number
                    <input
                      value={card.number}
                      onChange={(event) => setCard((current) => ({ ...current, number: event.target.value }))}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                    />
                  </label>
                  <div className="payment-field-row">
                    <label>
                      Expiry
                      <input
                        value={card.expiry}
                        onChange={(event) => setCard((current) => ({ ...current, expiry: event.target.value }))}
                        placeholder="MM/YY"
                      />
                    </label>
                    <label>
                      CVC
                      <input
                        value={card.cvc}
                        onChange={(event) => setCard((current) => ({ ...current, cvc: event.target.value }))}
                        placeholder="123"
                        inputMode="numeric"
                      />
                    </label>
                  </div>
                  <label className="payment-save-card">
                    <input type="checkbox" checked={saveCard} onChange={(event) => setSaveCard(event.target.checked)} />
                    <span aria-hidden="true" />
                    Save card for future Astravia drops
                  </label>
                </form>
              </div>
            ) : (
              <div className="payment-cod-panel">
                <FiTruck aria-hidden="true" />
                <div>
                  <h3>Cash On Delivery Selected</h3>
                  <p>Keep the exact amount ready at delivery. Your order will be confirmed after placing it.</p>
                </div>
              </div>
            )}

            <div className="payment-trust-row">
              <span><FiShield aria-hidden="true" /> 256-bit SSL</span>
              <span><FiSmartphone aria-hidden="true" /> OTP Protected</span>
              <span><FiCheck aria-hidden="true" /> Verified Checkout</span>
            </div>
          </div>
        </main>

        <aside className="payment-summary payment-animate">
          <Link to={isVoucherPayment ? '/giftvoucher' : '/checkout'} className="payment-back-link">
            <FiArrowLeft aria-hidden="true" />
            {isVoucherPayment ? 'Back To Voucher' : 'Back To Checkout'}
          </Link>

          <h2>{isVoucherPayment ? 'Voucher Summary' : 'Payment Summary'}</h2>
          {isVoucherPayment && checkout.voucher && (
            <div className="payment-voucher-note">
              <span>{checkout.voucher.design}</span>
              <strong>{checkout.voucher.code || 'Generated after payment'}</strong>
              <p>
                {checkout.voucher.delivery === 'email'
                  ? `Email delivery to ${checkout.voucher.recipient?.email || checkout.voucher.recipient?.name}`
                  : 'PDF download after payment'}
              </p>
            </div>
          )}
          <div className="payment-summary-items">
            {items.map((item) => (
              <div className="payment-summary-item" key={`${item.productId}-${item.size || 'One Size'}`}>
                <img src={item.image} alt={item.name} />
                <div>
                  <strong>{item.name}</strong>
                  <span>{itemMetaText(item)} {itemMetaText(item) ? '/ ' : ''}Qty {item.quantity || 1}</span>
                </div>
                <p className="astravia-price-stack">
                  <span className={isSaleItem(item) ? 'sale-price' : 'normal-price'}>{formatPrice(Number(item.price || 0) * (item.quantity || 1))}</span>
                  {isSaleItem(item) && <span className="original-price">{formatPrice(Number(item.originalPrice || 0) * (item.quantity || 1))}</span>}
                </p>
              </div>
            ))}
          </div>

          <div className="payment-lines">
            <p><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></p>
            <p><span>Shipping</span><strong>{formatPrice(shipping)}</strong></p>
          </div>

          <div className="payment-grand-total">
            <span>Total Due</span>
            <strong>{formatPrice(total)}</strong>
          </div>

          <button type="button" className="payment-confirm-btn" onClick={confirmPayment} disabled={!pricingReady || submitting || (!isVoucherPayment && !items.length)}>
            {method === 'card' ? 'Pay Securely' : 'Place COD Order'}
            <FiArrowRight aria-hidden="true" />
          </button>

          <p className="payment-fineprint">
            By confirming, you agree to Astravia order processing and secure payment verification.
          </p>
        </aside>
      </div>

      {toast && <div className="payment-toast">{toast}</div>}
    </section>
  );
}
