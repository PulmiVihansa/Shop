import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiHeart, FiLogOut, FiPackage, FiShield, FiShoppingBag, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import api, { getErrorMessage } from '../services/api.js';
import { resolveImageUrl } from '../utils/imageUrl.js';
import '../styles/account.css';

const formatCurrency = (value) => `LKR ${Number(value || 0).toLocaleString()}`;
const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const statusLabel = (order) => String(order?.orderStatus || order?.status || 'Processing').replace(/_/g, ' ');

export default function Account() {
  const { user, isAdmin, logout, updateUser } = useAuth();
  const { summary } = useCart();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderMessage, setOrderMessage] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');

  const displayName = user?.name || user?.email?.split('@')?.[0] || 'Astravia Member';
  const initials = String(displayName)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'A';
  const memberId = user?.customerId || user?.id?.slice(-8)?.toUpperCase() || 'ASTRAVIA';

  useEffect(() => {
    let active = true;
    api.get('/orders/user')
      .then((response) => {
        if (!active) return;
        setOrders(Array.isArray(response.data) ? response.data : []);
      })
      .catch((error) => {
        if (active) setOrderMessage(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoadingOrders(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const accountStats = useMemo(() => {
    const totalSpend = orders.reduce((sum, order) => sum + Number(order.totalAmount ?? order.totalPrice ?? 0), 0);
    const activeOrders = orders.filter((order) => !/delivered|cancelled/i.test(statusLabel(order))).length;
    return [
      { label: 'Orders', value: orders.length || 0 },
      { label: 'Active', value: activeOrders },
      { label: 'Spend', value: formatCurrency(totalSpend) },
    ];
  }, [orders]);

  const recentOrders = orders.slice(0, 3);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarMessage('Please choose a valid image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarMessage('Avatar image must be under 2MB.');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);
    setAvatarUploading(true);
    setAvatarMessage('');

    try {
      const response = await api.put('/auth/avatar', formData);
      updateUser(response.data.user);
      setAvatarMessage('Profile image updated.');
    } catch (error) {
      setAvatarMessage(getErrorMessage(error));
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <section className="account-page">
      <div className="account-shell">
        <header className="account-hero">
          <div className="account-identity">
            <div className="account-page-avatar">
              {user?.avatar ? <img src={resolveImageUrl(user.avatar)} alt="" /> : <span>{initials}</span>}
              <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}>
                {avatarUploading ? 'Uploading' : 'Change'}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="account-eyebrow">Member Account</p>
              <h1>{displayName}</h1>
              <p>{user?.email || 'Astravia customer account'}</p>
              {avatarMessage && <p className="account-avatar-message">{avatarMessage}</p>}
            </div>
          </div>
          <button type="button" className="account-signout" onClick={handleLogout}>
            <FiLogOut aria-hidden="true" />
            Sign Out
          </button>
        </header>

        <div className="account-main-grid">
          <aside className="account-profile-panel">
            <div className="account-member-card">
              <span>Member ID</span>
              <strong>{memberId}</strong>
              <p>{isAdmin ? 'Admin access enabled' : 'Astravia private client profile'}</p>
            </div>
            <div className="account-detail-list">
              <div><span>Name</span><strong>{displayName}</strong></div>
              <div><span>Email</span><strong>{user?.email || '-'}</strong></div>
              <div><span>Role</span><strong>{user?.role || 'customer'}</strong></div>
              <div><span>Joined</span><strong>{formatDate(user?.createdAt)}</strong></div>
            </div>
          </aside>

          <div className="account-content">
            <div className="account-stat-row">
              {accountStats.map((stat) => (
                <article className="account-stat" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </article>
              ))}
            </div>

            <div className="account-action-grid">
              <Link to="/orders/track">
                <FiPackage aria-hidden="true" />
                <span>Orders</span>
                <strong>Track purchases</strong>
                <FiArrowRight aria-hidden="true" />
              </Link>
              <Link to="/wishlist">
                <FiHeart aria-hidden="true" />
                <span>Wishlist</span>
                <strong>Saved pieces</strong>
                <FiArrowRight aria-hidden="true" />
              </Link>
              <Link to="/checkout">
                <FiShoppingBag aria-hidden="true" />
                <span>Bag</span>
                <strong>{summary.count} item{summary.count === 1 ? '' : 's'}</strong>
                <FiArrowRight aria-hidden="true" />
              </Link>
              <Link to={isAdmin ? '/admin' : '/contact'}>
                {isAdmin ? <FiShield aria-hidden="true" /> : <FiUser aria-hidden="true" />}
                <span>{isAdmin ? 'Admin' : 'Support'}</span>
                <strong>{isAdmin ? 'Dashboard' : 'Care team'}</strong>
                <FiArrowRight aria-hidden="true" />
              </Link>
            </div>

            <section className="account-orders-panel">
              <div className="account-section-head">
                <span>Recent Orders</span>
                <Link to="/orders/track">View all</Link>
              </div>
              {loadingOrders ? (
                <div className="account-empty-state">Loading your order history.</div>
              ) : recentOrders.length ? (
                <div className="account-order-list">
                  {recentOrders.map((order) => (
                    <article className="account-order-card" key={order.id || order._id || order.orderId}>
                      <div>
                        <span>{order.orderId || order.id || order._id}</span>
                        <strong>{statusLabel(order)}</strong>
                      </div>
                      <div>
                        <span>{formatDate(order.createdAt || order.orderDate)}</span>
                        <strong>{formatCurrency(order.totalAmount ?? order.totalPrice)}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="account-empty-state">
                  {orderMessage || 'No orders yet. Your first drop will appear here.'}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
