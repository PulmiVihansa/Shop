import { Link, useNavigate } from 'react-router-dom';
import '../styles/header.css';
import { useCart } from '../context/CartContext.jsx';

export default function Header() {
  const { items, summary, isOpen, openCart, closeCart, removeItem } = useCart();
  const navigate = useNavigate();
  const formatCurrency = (value) => `LKR${value.toLocaleString()}`;

  return (
    <>
      <nav className="atelier-nav">
        <div className="nw">
          <Link to="/" state={{ skipIntro: true }} className="logo">
            <img src="/models/logo.png" alt="Astravia" />
          </Link>
          <div className="nm">
            <Link to="/collection" className="nl">
              Collection
            </Link>
            <Link to="/giftvoucher" className="nl">
              Gift Vouchers
            </Link>
            <Link to="/sales" className="nl">
              Sale
            </Link>
            <Link to="/contact" className="nl">
              Contact Us
            </Link>
          </div>
          <div className="nr" aria-label="Utility navigation">
            <Link to="/login" className="ib" aria-label="Account">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
            <Link to="/wishlist" className="ib" aria-label="Wishlist">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </Link>
            <button
              type="button"
              className="ib"
              aria-label={`Bag with ${summary.count} items`}
              aria-expanded={isOpen}
              onClick={openCart}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              <span className="bag-n">{summary.count}</span>
            </button>
          </div>
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
            <h3>astravia Cart</h3>
          </div>
          <button type="button" className="cart-close" onClick={closeCart} aria-label="Close cart">
            {'\u00D7'}
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
              <div key={`${item.productId}-${item.size || 'One Size'}`} className="cart-item">
                <div className="cart-item-image">
                  {item.image ? <img src={item.image} alt={item.name} /> : <span>{item.name}</span>}
                </div>
                <div className="cart-item-info">
                  <p>{item.name}</p>
                  <span>
                    Size {item.size || 'One Size'} {'\u00B7'} Qty {item.quantity || 1}
                  </span>
                </div>
                <strong>{formatCurrency(item.price * (item.quantity || 1))}</strong>
                <button
                  type="button"
                  className="cart-remove"
                  aria-label="Remove item"
                  onClick={() => removeItem(item.productId, item.size)}
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
          <button
            type="button"
            className="cart-checkout"
            disabled={items.length === 0}
            onClick={() => {
              closeCart();
              navigate('/checkout');
            }}
          >
            Checkout
          </button>
        </div>
      </aside>
    </>
  );
}
