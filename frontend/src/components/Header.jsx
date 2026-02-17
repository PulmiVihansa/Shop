import { Link } from 'react-router-dom';
import '../styles/header.css';
import { useCart } from '../context/CartContext.jsx';

export default function Header() {
  const { items, summary, isOpen, openCart, closeCart, removeItem } = useCart();
  const formatCurrency = (value) => `$${value.toLocaleString()}`;

  return (
    <>
      <nav className="site-nav">
        <div className="logo">
          <Link to="/">ATELIER</Link>
        </div>

        <ul className="nav-links">
          <li className="nav-dropdown">
            <button type="button" className="nav-link-button">Women</button>
            <div className="dropdown-menu">
              <Link to="/women/new">New Arrivals</Link>
              <Link to="/women/dresses">Dresses</Link>
              <Link to="/women/tops">Tops</Link>
            </div>
          </li>
          <li className="nav-dropdown">
            <button type="button" className="nav-link-button">Men</button>
            <div className="dropdown-menu">
              <Link to="/men/new">New Arrivals</Link>
              <Link to="/men/shirts">Shirts</Link>
              <Link to="/men/outerwear">Outerwear</Link>
            </div>
          </li>
          <li>
            <Link to="/giftvoucher">Gift Vouchers</Link>
          </li>
          <li>
            <Link to="/sales">Sales</Link>
          </li>
        </ul>

        <div className="nav-icons" aria-label="Utility navigation">
          <Link to="/login" className="login-icon" aria-label="Login">
            {'\u{1F464}\u{FE0E}'}
          </Link>
          <Link to="/wishlist" className="nav-icon" aria-label="Wishlist">
            {'\u2661\uFE0E'}
          </Link>
          <button
            type="button"
            className="nav-icon cart-icon"
            aria-label={`Cart with ${summary.count} items`}
            aria-expanded={isOpen}
            onClick={openCart}
          >
            {'\u{1F6D2}\u{FE0E}'}
            <span className="cart-count">{summary.count}</span>
          </button>
        </div>
      </nav>

      <div
        className={`cart-backdrop ${isOpen ? 'is-open' : ''}`}
        onClick={closeCart}
        aria-hidden={!isOpen}
      />
      <aside className={`cart-drawer ${isOpen ? 'is-open' : ''}`} role="dialog" aria-label="Cart">
        <div className="cart-drawer-header">
          <div>
            <p className="cart-kicker">Your Bag</p>
            <h3>Atelier Cart</h3>
          </div>
          <button type="button" className="cart-close" onClick={closeCart} aria-label="Close cart">
            ✕
          </button>
        </div>

        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <p>Your bag is empty.</p>
              <span>Add pieces to see them here.</span>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className={`cart-item-image ${item.imageClass || ''}`} />
                <div className="cart-item-info">
                  <p>{item.name}</p>
                  <span>{item.size || 'One Size'} · Qty {item.quantity || 1}</span>
                </div>
                <strong>{formatCurrency(item.price * (item.quantity || 1))}</strong>
                <button
                  type="button"
                  className="cart-remove"
                  aria-label="Remove item"
                  onClick={() => removeItem(item.id)}
                >
                  {'\u{1F5D1}\u{FE0E}'}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="cart-drawer-footer">
          <div className="cart-summary">
            <span>Subtotal</span>
            <strong>{formatCurrency(summary.subtotal)}</strong>
          </div>
          <button type="button" className="cart-checkout" disabled={items.length === 0}>
            Checkout
          </button>
        </div>
      </aside>
    </>
  );
}
