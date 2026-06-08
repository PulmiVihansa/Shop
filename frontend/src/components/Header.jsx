import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import '../styles/header.css';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { prefetchCollectionProducts } from '../hooks/useCollectionProducts.js';
import { prefetchSalesProducts } from '../services/salesQueries.js';
import { fetchProducts, productsQueryDefaults } from '../services/productsQueries.js';
import { salesProductsQuery } from '../services/salesQueries.js';
import { isSaleItem, itemMetaText, pricingTotals, resolvePricedItems } from '../utils/pricing.js';

export default function Header() {
  const { items, summary, isOpen, openCart, closeCart, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const warmSales = useCallback(() => prefetchSalesProducts(queryClient), [queryClient]);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const productsQuery = useQuery({
    queryKey: ['products', 'cart-pricing'],
    queryFn: () => fetchProducts({ source: 'cart-pricing', limit: 500 }),
    enabled: items.length > 0,
    ...productsQueryDefaults,
  });
  const salesQuery = useQuery({
    ...salesProductsQuery,
    enabled: items.length > 0,
  });
  const cartItems = items.length
    ? resolvePricedItems(items, productsQuery.data || [], salesQuery.data || [])
    : [];
  const cartSummary = pricingTotals(cartItems, 0);

  const navLinks = [
    { to: '/collection', label: 'Collection', warm: prefetchCollectionProducts },
    { to: '/giftvoucher', label: 'Gift Vouchers' },
    { to: '/sales', label: 'Sale', warm: warmSales },
    { to: '/contact', label: 'Contact Us' },
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-lock', mobileMenuOpen);
    return () => document.body.classList.remove('mobile-menu-lock');
  }, [mobileMenuOpen]);

  const openAccount = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/account');
  };

  return (
    <>
      <nav className="atelier-nav">
        <div className="nw">
          <Link to="/" state={{ skipIntro: true }} className="logo">
            <img src="/models/logo.png" alt="Astravia" />
          </Link>
          <div className="nm">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="nl"
                onMouseEnter={link.warm}
                onFocus={link.warm}
                onPointerDown={link.warm}
                onClick={link.warm}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="nr" aria-label="Utility navigation">
            <button
              type="button"
              className={`ib ${isAuthenticated ? 'account-icon-auth' : ''}`}
              aria-label={isAuthenticated ? 'Open account page' : 'Sign in'}
              onClick={openAccount}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {isAuthenticated && <span className="account-dot" aria-hidden="true" />}
            </button>
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
            <button
              type="button"
              className="ib menu-toggle"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-controls="mobile-navigation"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`mobile-menu-backdrop ${mobileMenuOpen ? 'is-open' : ''}`}
        onClick={closeMobileMenu}
        aria-hidden={!mobileMenuOpen}
      />
      <aside
        id="mobile-navigation"
        className={`mobile-nav-panel ${mobileMenuOpen ? 'is-open' : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="mobile-nav-head">
          <span>Menu</span>
          <button type="button" onClick={closeMobileMenu} aria-label="Close menu">
            <FiX aria-hidden="true" />
          </button>
        </div>
        <div className="mobile-nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onMouseEnter={link.warm}
              onFocus={link.warm}
              onPointerDown={link.warm}
              onClick={link.warm}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="mobile-nav-actions">
          <button
            type="button"
            onClick={() => {
              closeMobileMenu();
              openAccount();
            }}
          >
            {isAuthenticated ? 'My Account' : 'Sign In'}
          </button>
          <Link to="/wishlist" onClick={closeMobileMenu}>Wishlist</Link>
          <button
            type="button"
            onClick={() => {
              closeMobileMenu();
              openCart();
            }}
          >
            Bag ({summary.count})
          </button>
        </div>
      </aside>

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
            cartItems.map((item) => (
              <div key={`${item.productId}-${item.size || 'One Size'}`} className="cart-item">
                <div className="cart-item-image">
                  {item.image ? <img src={item.image} alt={item.name} /> : <span>{item.name}</span>}
                </div>
                <div className="cart-item-info">
                  <p>{item.name}</p>
                  <span>{itemMetaText(item)} {itemMetaText(item) ? '\u00B7' : ''} Qty {item.quantity || 1}</span>
                </div>
                <div className="astravia-price-stack">
                  <span className={isSaleItem(item) ? 'sale-price' : 'normal-price'}>{formatCurrency(item.price * (item.quantity || 1))}</span>
                  {isSaleItem(item) && <span className="original-price">{formatCurrency(item.originalPrice * (item.quantity || 1))}</span>}
                </div>
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
            <strong>{formatCurrency(cartSummary.subtotal)}</strong>
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

