import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiClipboard, FiHome, FiPackage, FiShield, FiTruck } from 'react-icons/fi';
import api from '../services/api.js';
import '../styles/order-success.css';

const fallbackOrder = {
  orderId: '',
  transactionId: '',
  totalAmount: 7317,
  payment: { method: 'Credit / Debit Card', status: 'Paid' },
  shipping: 'standard',
  items: [
    { productId: 'chaos-tee', name: 'Chaos Tee', image: '/models/Tshirt8.png', color: 'Black', size: 'M', quantity: 1, price: 2490 },
    { productId: 'rebuild-tee', name: 'Rebuild Tee', image: '/models/Tshirt5.png', color: 'Stone', size: 'M', quantity: 1, price: 2145 },
    { productId: 'phantom-tee', name: 'Phantom Tee', image: '/models/Tshirt11.png', color: 'Black', size: 'L', quantity: 1, price: 3056 },
  ],
};

const formatPrice = (value) => `Rs. ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OrderSuccess() {
  const location = useLocation();
  const { state, search } = location;
  const [remoteOrder, setRemoteOrder] = useState(null);
  const queryOrderId = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get('order_id') || params.get('orderId') || '';
  }, [search]);
  const order = remoteOrder || state?.order || fallbackOrder;
  const orderNumber = order.orderId || order.orderNumber || '';
  const transactionId = order.transactionId || order.payment?.reference || '';
  const items = order.items?.length ? order.items : fallbackOrder.items;
  const total = order.totalAmount ?? order.totalPrice ?? items.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0);

  useEffect(() => {
    if (!queryOrderId || state?.order) return;
    let active = true;
    api.get(`/payments/order/${encodeURIComponent(queryOrderId)}`)
      .then((response) => {
        if (active) setRemoteOrder(response.data);
      })
      .catch(() => {
        if (active) setRemoteOrder(null);
      });
    return () => {
      active = false;
    };
  }, [queryOrderId, state?.order]);

  return (
    <section className="astravia-confirmation-page">
      <div className="confirmation-steps" aria-label="Checkout progress">
        {[
          ['01.', 'Cart'],
          ['02.', 'Checkout'],
          ['03.', 'Payment'],
          ['04.', 'Confirmation'],
        ].map(([number, label], index) => (
          <div className={label === 'Confirmation' ? 'active' : ''} key={label}>
            <span>{number}</span>
            {label}
            {index < 3 && <i aria-hidden="true" />}
          </div>
        ))}
      </div>

      <div className="confirmation-shell">
        <main className="confirmation-hero confirmation-animate">
          <div className="confirmation-mark" aria-hidden="true">
            <FiCheck />
          </div>
          <span className="confirmation-kicker">Order Confirmed</span>
          <h1>Drop Secured.</h1>
          <p>
            Your Astravia order is locked in. We are preparing your pieces and will send delivery updates as the order moves.
          </p>

          <div className="confirmation-meta">
            <div>
              <span>Order ID</span>
              <strong>{orderNumber || 'Pending'}</strong>
            </div>
            <div>
              <span>Transaction ID</span>
              <strong>{transactionId || 'Pending'}</strong>
            </div>
            <div>
              <span>Payment</span>
              <strong>{order.payment?.status || order.paymentStatus || 'Pending'}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatPrice(total)}</strong>
            </div>
          </div>

          <div className="confirmation-actions">
            <Link to="/orders/track" className="confirmation-primary">
              Track Order
              <FiArrowRight aria-hidden="true" />
            </Link>
            <Link to="/collection" className="confirmation-secondary">
              Continue Shopping
            </Link>
            <Link to="/" className="confirmation-ghost">
              <FiHome aria-hidden="true" />
              Back Home
            </Link>
          </div>
        </main>

        <aside className="confirmation-receipt confirmation-animate">
          <div className="receipt-head">
            <span>Digital Receipt</span>
            <h2>Order Summary</h2>
          </div>

          <div className="receipt-items">
            {items.map((item) => (
              <div className="receipt-item" key={`${item.productId || item.name}-${item.size || 'M'}`}>
                <img src={item.image} alt={item.name} />
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.color || 'Black'} / {item.size || 'M'} / Qty {item.quantity || 1}</span>
                </div>
                <p>{formatPrice(Number(item.price || 0) * (item.quantity || 1))}</p>
              </div>
            ))}
          </div>

          <div className="receipt-total">
            <span>Total Paid</span>
            <strong>{formatPrice(total)}</strong>
          </div>

          <div className="confirmation-delivery-card">
            <FiTruck aria-hidden="true" />
            <div>
              <h3>Delivery Window</h3>
              <p>{order.shipping === 'express' ? '1-2 business days' : '3-5 business days'} after order processing.</p>
            </div>
          </div>
        </aside>

        <section className="confirmation-timeline confirmation-animate">
          {[
            [FiShield, 'Payment Verified', 'Your payment status has been confirmed and secured.'],
            [FiClipboard, 'Order Review', 'Astravia checks stock, sizing, and delivery details.'],
            [FiPackage, 'Packing Drop', 'Your pieces are packed in the Astravia dispatch flow.'],
            [FiTruck, 'Delivery Update', 'You will receive tracking or delivery contact soon.'],
          ].map(([Icon, title, text], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <Icon aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </section>
      </div>
    </section>
  );
}
