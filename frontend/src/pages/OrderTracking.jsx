import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api.js';
import '../styles/order-tracking.css';

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
          setSelectedId(response.data[0]?._id || response.data[0]?.id || '');
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
    () => orders.find((order) => (order._id || order.id) === selectedId) || orders[0],
    [orders, selectedId]
  );

  const currentStatus = selectedOrder?.orderStatus || selectedOrder?.status;
  const currentStep = statusIndex[currentStatus] ?? 0;

  return (
    <section className="tracking-page">
      <header className="tracking-hero">
        <div>
          <span className="tracking-eyebrow">Order Tracking</span>
          <h1>Track your order.</h1>
          <p>Follow what happens after payment, from confirmation to delivery.</p>
        </div>
        <Link to="/men-new-arrivals" className="tracking-shop-link">Continue Shopping</Link>
      </header>

      {loading && <div className="tracking-alert">Loading your orders...</div>}
      {error && <div className="tracking-alert">{error}</div>}

      {!loading && !orders.length ? (
        <div className="tracking-empty">
          <span className="tracking-eyebrow">No Orders</span>
          <h2>No orders to track yet.</h2>
          <p>Complete checkout and your order timeline will appear here.</p>
          <Link to="/men-new-arrivals" className="tracking-primary">Shop New Arrivals</Link>
        </div>
      ) : selectedOrder ? (
        <div className="tracking-layout">
          <aside className="tracking-orders">
            <div className="tracking-section-head">
              <span>History</span>
              <h2>Your Orders</h2>
            </div>
            {orders.map((order) => {
              const rowId = order._id || order.id;
              return (
                <button
                  key={rowId}
                  type="button"
                  className={(selectedOrder._id || selectedOrder.id) === rowId ? 'active' : ''}
                  onClick={() => setSelectedId(rowId)}
                >
                  <strong>#{order.orderId || String(rowId).slice(-8).toUpperCase()}</strong>
                  <span>{formatCurrency(order.totalAmount ?? order.totalPrice)} - {order.orderStatus || order.status}</span>
                </button>
              );
            })}
          </aside>

          <main className="tracking-panel">
            <div className="tracking-summary-line">
              <div>
                <span>Order ID</span>
                <strong>#{selectedOrder.orderId || String(selectedOrder._id || selectedOrder.id).slice(-8).toUpperCase()}</strong>
              </div>
              <div>
                <span>Payment</span>
                <strong>{selectedOrder.payment?.status || selectedOrder.paymentStatus?.toLowerCase() || 'pending'}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatCurrency(selectedOrder.totalAmount ?? selectedOrder.totalPrice)}</strong>
              </div>
            </div>

            <div className={`tracking-timeline ${currentStatus === 'cancelled' ? 'cancelled' : ''}`}>
              {currentStatus === 'cancelled' ? (
                <div className="tracking-cancelled">
                  <h2>Order Cancelled</h2>
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
                  <h2>Order Pieces</h2>
                </div>
                <div className="tracking-items">
                  {(selectedOrder.items?.length
                    ? selectedOrder.items
                    : [{ name: selectedOrder.productName, size: selectedOrder.size, quantity: selectedOrder.quantity, price: selectedOrder.price }]
                  ).map((item) => (
                    <div className="tracking-item" key={`${item.product || item.productId || item.name}-${item.size}`}>
                      <div className="tracking-item-image">
                        {item.image ? <img src={item.image} alt={item.name} /> : null}
                      </div>
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.size || 'One Size'} - Qty {item.quantity || 1}</span>
                      </div>
                      <p>{formatCurrency(Number(item.price || 0) * Number(item.quantity || 1))}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="tracking-card">
                <div className="tracking-section-head">
                  <span>Delivery</span>
                  <h2>Shipping Details</h2>
                </div>
                <div className="tracking-address">
                  <strong>{selectedOrder.customerName || selectedOrder.address?.fullName}</strong>
                  <p>{selectedOrder.address?.line1}</p>
                  {selectedOrder.address?.line2 && <p>{selectedOrder.address.line2}</p>}
                  <p>{selectedOrder.address?.city}, {selectedOrder.address?.postalCode}</p>
                  <p>{selectedOrder.address?.country}</p>
                  <p>{selectedOrder.phone || selectedOrder.address?.phone}</p>
                </div>
              </section>
            </div>
          </main>
        </div>
      ) : null}
    </section>
  );
}

