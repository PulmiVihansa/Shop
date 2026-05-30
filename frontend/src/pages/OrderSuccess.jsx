import { Link, useLocation } from 'react-router-dom';
import '../styles/order-success.css';
import usePageContent from '../hooks/usePageContent.js';

const formatCurrency = (value) => `LKR${Number(value || 0).toLocaleString()}`;

export default function OrderSuccess() {
  const content = usePageContent('orderSuccess');
  const { state } = useLocation();
  const order = state?.order;
  const shortId = order?._id ? String(order._id).slice(-8).toUpperCase() : 'PENDING';

  return (
    <section className="order-success-page">
      <div className="success-shell">
        <div className="success-panel">
          <div className="success-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <span className="success-eyebrow">{content.eyebrow}</span>
          <h1>{content.title}</h1>
          <p>
            Your ATELIER order has been received. We will prepare your pieces and contact you if we need any delivery
            details confirmed.
          </p>

          <div className="success-meta">
            <div>
              <span>Order ID</span>
              <strong>#{shortId}</strong>
            </div>
            <div>
              <span>Payment</span>
              <strong>{order?.payment?.status || 'Confirmed'}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{order?.status || 'Pending'}</strong>
            </div>
          </div>

          <div className="success-actions">
            <Link to="/orders/track" className="success-primary">Track Order</Link>
            <Link to="/men-new-arrivals" className="success-primary">Continue Shopping</Link>
            <Link to="/" className="success-secondary">Back Home</Link>
          </div>
        </div>

        <aside className="success-summary">
          <div className="summary-head">
            <span>Receipt</span>
            <h2>{content.summaryTitle}</h2>
          </div>

          {order?.items?.length ? (
            <div className="success-items">
              {order.items.map((item) => (
                <div className="success-item" key={`${item.name}-${item.size}`}>
                  <div className={`success-item-image ${item.imageClass || ''}`} />
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.size || 'One Size'} · Qty {item.quantity || 1}</span>
                  </div>
                  <p>{formatCurrency(item.price * (item.quantity || 1))}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="success-muted">Your order details will appear here after checkout.</p>
          )}

          <div className="success-total">
            <span>Total Paid</span>
            <strong>{formatCurrency(order?.totalPrice)}</strong>
          </div>

          <div className="success-next">
            <h3>{content.nextTitle}</h3>
            <p>1. Order review and stock confirmation</p>
            <p>2. Packing by the ATELIER team</p>
            <p>3. Delivery update by phone or WhatsApp</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
