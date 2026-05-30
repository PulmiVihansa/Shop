import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api.js';
import '../styles/order-tracking.css';
import usePageContent from '../hooks/usePageContent.js';

const formatCurrency = (value) => `LKR${Number(value || 0).toLocaleString()}`;

const steps = [
  { key: 'pending', label: 'Order Confirmed', body: 'Your order has been received by ATELIER.' },
  { key: 'processing', label: 'Processing', body: 'Your pieces are being checked, packed, and prepared.' },
  { key: 'shipped', label: 'Shipped', body: 'Your parcel is on the way with delivery updates.' },
  { key: 'delivered', label: 'Delivered', body: 'Your order has reached you. Thank you for shopping ATELIER.' },
];

const statusIndex = {
  pending: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
};

export default function OrderTracking() {
  const content = usePageContent('orderTracking');
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/orders/user');
        if (active) {
          setOrders(response.data);
          setSelectedId(response.data[0]?._id || '');
        }
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((order) => order._id === selectedId) || orders[0],
    [orders, selectedId]
  );

  const currentStep = statusIndex[selectedOrder?.status] ?? 0;

  return (
    <section className="tracking-page">
      <header className="tracking-hero">
        <div>
          <span className="tracking-eyebrow">{content.eyebrow}</span>
          <h1>{content.title}</h1>
          <p>Follow what happens after payment, from confirmation to delivery.</p>
        </div>
        <Link to="/men-new-arrivals" className="tracking-shop-link">Continue Shopping</Link>
      </header>

      {loading && <div className="tracking-alert">Loading your orders...</div>}
      {error && <div className="tracking-alert">{error}</div>}

      {!loading && !orders.length ? (
        <div className="tracking-empty">
          <span className="tracking-eyebrow">{content.noOrdersEyebrow}</span>
          <h2>{content.noOrdersTitle}</h2>
          <p>Complete checkout and your order timeline will appear here.</p>
          <Link to="/men-new-arrivals" className="tracking-primary">Shop New Arrivals</Link>
        </div>
      ) : selectedOrder ? (
        <div className="tracking-layout">
          <aside className="tracking-orders">
            <div className="tracking-section-head">
              <span>History</span>
              <h2>{content.ordersTitle}</h2>
            </div>
            {orders.map((order) => (
              <button
                key={order._id}
                type="button"
                className={selectedOrder._id === order._id ? 'active' : ''}
                onClick={() => setSelectedId(order._id)}
              >
                <strong>#{String(order._id).slice(-8).toUpperCase()}</strong>
                <span>{formatCurrency(order.totalPrice)} · {order.status}</span>
              </button>
            ))}
          </aside>

          <main className="tracking-panel">
            <div className="tracking-summary-line">
              <div>
                <span>Order ID</span>
                <strong>#{String(selectedOrder._id).slice(-8).toUpperCase()}</strong>
              </div>
              <div>
                <span>Payment</span>
                <strong>{selectedOrder.payment?.status || 'pending'}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatCurrency(selectedOrder.totalPrice)}</strong>
              </div>
            </div>

            <div className={`tracking-timeline ${selectedOrder.status === 'cancelled' ? 'cancelled' : ''}`}>
              {selectedOrder.status === 'cancelled' ? (
                <div className="tracking-cancelled">
                  <h2>{content.cancelledTitle}</h2>
                  <p>This order has been cancelled. Contact support if this was unexpected.</p>
                </div>
              ) : (
                steps.map((step, index) => (
                  <div key={step.key} className={`tracking-step ${index <= currentStep ? 'done' : ''}`}>
                    <div className="tracking-dot">{index + 1}</div>
                    <div>
                      <h3>{step.label}</h3>
                      <p>{step.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="tracking-two-col">
              <section className="tracking-card">
                <div className="tracking-section-head">
                  <span>Items</span>
                  <h2>{content.piecesTitle}</h2>
                </div>
                <div className="tracking-items">
                  {selectedOrder.items.map((item) => (
                    <div className="tracking-item" key={`${item.name}-${item.size}`}>
                      <div className={`tracking-item-image ${item.imageClass || ''}`} />
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.size || 'One Size'} · Qty {item.quantity || 1}</span>
                      </div>
                      <p>{formatCurrency(item.price * (item.quantity || 1))}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="tracking-card">
                <div className="tracking-section-head">
                  <span>Delivery</span>
                  <h2>{content.shippingTitle}</h2>
                </div>
                <div className="tracking-address">
                  <strong>{selectedOrder.address?.fullName}</strong>
                  <p>{selectedOrder.address?.line1}</p>
                  {selectedOrder.address?.line2 && <p>{selectedOrder.address.line2}</p>}
                  <p>{selectedOrder.address?.city}, {selectedOrder.address?.postalCode}</p>
                  <p>{selectedOrder.address?.country}</p>
                  <p>{selectedOrder.address?.phone}</p>
                </div>
              </section>
            </div>
          </main>
        </div>
      ) : null}
    </section>
  );
}
