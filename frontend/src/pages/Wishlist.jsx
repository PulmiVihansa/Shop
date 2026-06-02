import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiBell, FiHeart, FiLock, FiTrash2 } from 'react-icons/fi';
import { astraviaProducts, formatAstraviaPrice } from '../data/astraviaProducts.js';
import '../styles/wishlist-luxury.css';

const wishlistStorageKey = 'astravia_wishlist';
const readSavedWishlist = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(wishlistStorageKey) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const writeSavedWishlist = (items) => {
  localStorage.setItem(wishlistStorageKey, JSON.stringify(items));
};

const fallbackWishlist = astraviaProducts.slice(0, 6).map((product) => ({
  ...product,
  selectedSize: 'M',
  sizes: ['S', 'M', 'L', 'XL', 'XXL'],
}));

export default function Wishlist() {
  const [items, setItems] = useState(() => {
    const saved = readSavedWishlist();
    return saved.length ? saved.slice(0, 6) : fallbackWishlist;
  });

  const visibleItems = useMemo(() => items.slice(0, 6), [items]);

  const handleRemove = (id) => {
    setItems((current) => {
      const next = current.filter((item) => item.id !== id);
      writeSavedWishlist(next);
      return next;
    });
  };

  return (
    <section className="astravia-wishlist-page">
      <div className="wishlisttop-banner">
        <img src="/models/wishlisttop.png" alt="Astravia wishlist banner" />
      </div>

      <div className="wishlist-content-shell">
        <div className="wishlist-heading">
          <p>Your Favorites</p>
          <h1>WISH<span>LIST</span></h1>
          <small>Your saved Astravia pieces.</small>
        </div>

        <div className="wishlist-product-grid">
          {visibleItems.map((item) => (
            <article className="wishlist-lux-card" key={item.id}>
              <button className="wishlist-remove" type="button" aria-label={`Remove ${item.name}`} onClick={() => handleRemove(item.id)}>
                <FiTrash2 aria-hidden="true" />
              </button>
              <Link className="wishlist-card-image" to={`/products/${item.id}`}>
                <img src={item.image || '/models/Tshirt8.png'} alt={item.name} />
              </Link>
              <div className="wishlist-card-body">
                <h2>{item.name}</h2>
                <p>{formatAstraviaPrice(item.price)}</p>
                <div className="wishlist-card-meta">
                  <div className="wishlist-colors" aria-label="Color selector">
                    {['#050505', '#f5f1e8', '#727176'].map((color) => (
                      <span key={color} style={{ background: color }} />
                    ))}
                  </div>
                  <span className="wishlist-size">{item.selectedSize || 'M'}</span>
                </div>
                <Link className="wishlist-arrow" to={`/products/${item.id}`} aria-label={`View ${item.name}`}>
                  <FiArrowRight aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="wishlist-feature-row">
          {[
            ['Save Your Favorites', 'Keep your Astravia pieces ready for the next drop.', FiHeart],
            ['Restock Alerts', 'Get notified when limited tees return.', FiBell],
            ['Secure & Private', 'Your wishlist stays encrypted and personal.', FiLock],
          ].map(([title, text, Icon]) => (
            <article key={title}>
              <Icon aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
