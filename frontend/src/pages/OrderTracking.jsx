import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiShield, FiTruck } from 'react-icons/fi';
import api, { getErrorMessage } from '../services/api.js';
import '../styles/customer-care.css';

const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const steps = [
  ['Confirmed', 'Your Astravia order has entered the system.'],
  ['Packed', 'The drop is being checked, folded, and sealed.'],
  ['In Transit', 'Your package is moving with the courier.'],
  ['Delivered', 'The order has reached your door.'],
];

const statusIndex = { pending: 0, processing: 1, shipped: 2, delivered: 3 };

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/orders/user')
      .then((response) => {
        if (!active) return;
        setOrders(response.data || []);
        setSelectedId(response.data?.[0]?._id || response.data?.[0]?.id || '');
      })
      .catch((error) => {
        if (active) setMessage(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((order) => (order._id || order.id) === selectedId) || orders[0],
    [orders, selectedId],
  );
  const status = String(selectedOrder?.orderStatus || selectedOrder?.status || 'pending').toLowerCase();
  const currentStep = statusIndex[status] ?? 0;

  const trackManual = (event) => {
    event.preventDefault();
    setMessage(manualId.trim() ? `Tracking request received for ${manualId.trim().toUpperCase()}.` : 'Enter an Astravia order number.');
  };

  return (
    <section className="care-page">
      <div className="care-shell">
        <header className="care-hero">
          <div className="care-hero-copy">
            <p className="care-kicker">Track Order</p>
            <h1>FOLLOW<br /><em>THE DROP.</em></h1>
            <p>Track your Astravia package from payment confirmation to delivery. Every order update, clean and direct.</p>
          </div>
          <div className="care-logo-panel">
            <img src="/models/logo.png" alt="Astravia" />
          </div>
        </header>

        <div className="care-grid">
          {[
            [FiPackage, 'Order Sync', 'Logged-in customers see recent Astravia orders automatically.'],
            [FiTruck, 'Courier Flow', 'Track packing, dispatch, transit, and delivery stages.'],
            [FiShield, 'Secure Lookup', 'Order details stay protected inside your account.'],
          ].map(([Icon, title, text]) => (
            <article className="care-card" key={title}>
              <Icon aria-hidden="true" />
              <span>{title}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <div className="care-layout">
          <main className="care-panel">
            <span className="care-panel-label">Live Status</span>
            <h2>{selectedOrder ? `#${selectedOrder.orderId || String(selectedOrder._id || selectedOrder.id).slice(-8).toUpperCase()}` : 'No Active Order'}</h2>
            {loading && <p>Loading your Astravia orders...</p>}
            {!loading && !orders.length && (
              <>
                <p>No orders found yet. Once you complete checkout, your timeline will appear here.</p>
                <Link className="care-button" to="/collection">Shop Collection</Link>
              </>
            )}
            {selectedOrder && (
              <>
                <div className="care-status">
                  {steps.map(([title, text], index) => (
                    <div className="care-status-step" key={title}>
                      <div className="care-dot">{index <= currentStep ? '✓' : index + 1}</div>
                      <div>
                        <h3>{title}</h3>
                        <p>{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="care-toast">Total: {formatCurrency(selectedOrder.totalAmount ?? selectedOrder.totalPrice)} · Status: {status}</div>
              </>
            )}
          </main>

          <aside className="care-panel">
            <span className="care-panel-label">Order Lookup</span>
            <h2>Your Orders</h2>
            <div className="care-list">
              {orders.map((order) => {
                const rowId = order._id || order.id;
                return (
                  <article key={rowId}>
                    <button className="care-button" type="button" onClick={() => setSelectedId(rowId)}>
                      #{order.orderId || String(rowId).slice(-8).toUpperCase()}
                    </button>
                    <p>{formatCurrency(order.totalAmount ?? order.totalPrice)} · {order.orderStatus || order.status}</p>
                  </article>
                );
              })}
            </div>
            <form className="care-form" onSubmit={trackManual}>
              <label>
                Track By Order ID
                <input value={manualId} onChange={(event) => setManualId(event.target.value)} placeholder="AST-123456" />
              </label>
              <button className="care-button" type="submit">Track Order</button>
            </form>
            {message && <div className="care-toast">{message}</div>}
          </aside>
        </div>
      </div>
    </section>
  );
}
