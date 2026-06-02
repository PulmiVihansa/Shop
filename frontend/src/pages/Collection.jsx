import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiGrid, FiHeart, FiMenu, FiSliders } from 'react-icons/fi';
import { astraviaProducts, formatAstraviaPrice } from '../data/astraviaProducts.js';
import '../styles/collection.css';

const wishlistStorageKey = 'astravia_wishlist';
const readWishlist = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(wishlistStorageKey) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const filterSections = [
  ['Category', ['Graphic Tee', 'Oversized', 'Limited', 'Essentials']],
  ['Size', ['S', 'M', 'L', 'XL', 'XXL']],
  ['Color', ['Black', 'Cream', 'Grey']],
];

export default function Collection() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(['Graphic Tee']);
  const [priceMax, setPriceMax] = useState(6500);
  const [wishlist, setWishlist] = useState(() => new Set(readWishlist().map((item) => item.id)));
  const [wishlistMessage, setWishlistMessage] = useState('');

  const visibleProducts = useMemo(() => {
    const categoryFilters = activeFilters.filter((filter) => ['Graphic Tee', 'Oversized', 'Limited', 'Essentials'].includes(filter));
    const colorFilters = activeFilters.filter((filter) => ['Black', 'Cream', 'Grey'].includes(filter));
    return astraviaProducts.filter((product) => {
      const matchesCategory = !categoryFilters.length || categoryFilters.includes(product.category);
      const matchesColor = !colorFilters.length || colorFilters.includes(product.color);
      return matchesCategory && matchesColor && product.price <= priceMax;
    });
  }, [activeFilters, priceMax]);

  const toggleFilter = (value) => {
    setActiveFilters((current) => (
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    ));
  };

  const toggleWishlist = (product) => {
    const saved = readWishlist();
    const exists = saved.some((item) => item.id === product.id);
    const next = exists
      ? saved.filter((item) => item.id !== product.id)
      : [
          ...saved,
          {
            id: product.id,
            name: product.name,
            label: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            selectedSize: 'M',
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            saved: 'Saved just now',
          },
        ];

    localStorage.setItem(wishlistStorageKey, JSON.stringify(next));
    setWishlist(new Set(next.map((item) => item.id)));
    setWishlistMessage(exists ? `${product.name} removed from wishlist` : `${product.name} saved to wishlist`);
    window.setTimeout(() => setWishlistMessage(''), 2200);
  };

  const filterPanel = (
    <aside className="collection-filter-panel">
      <div className="filter-panel-heading">
        <FiSliders aria-hidden="true" />
        <span>Filters</span>
      </div>

      {filterSections.map(([title, options]) => (
        <div className="filter-block" key={title}>
          <h3>{title}</h3>
          <div className="filter-options">
            {options.map((option) => (
              <label className="filter-check" key={option}>
                <input
                  type="checkbox"
                  checked={activeFilters.includes(option)}
                  onChange={() => toggleFilter(option)}
                />
                <span aria-hidden="true" />
                {option}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="filter-block">
        <h3>Price</h3>
        <input
          className="price-range"
          type="range"
          min="2500"
          max="6500"
          step="100"
          value={priceMax}
          onChange={(event) => setPriceMax(Number(event.target.value))}
        />
        <div className="price-row">
          <span>Rs. 2,500</span>
          <span>{formatAstraviaPrice(priceMax)}</span>
        </div>
      </div>
    </aside>
  );

  return (
    <section className="collection-page">
      <div className="wishlisttop-banner">
        <img src="/models/wishlisttop.png" alt="Astravia collection banner" />
      </div>

      <div className="collection-shell">
        <button className="mobile-filter-button" type="button" onClick={() => setDrawerOpen(true)}>
          <FiMenu aria-hidden="true" />
          Filters
        </button>

        <div className="collection-sidebar">{filterPanel}</div>

        <div className="collection-products-area">
          <div className="collection-sort-bar">
            <div>
              <span>Sort By:</span>
              <strong>Best Selling</strong>
            </div>
            <div className="grid-toggle-icons" aria-hidden="true">
              <FiGrid />
              <FiGrid />
            </div>
          </div>
          {wishlistMessage && <div className="collection-toast">{wishlistMessage}</div>}

          <div className="collection-product-grid">
            {visibleProducts.map((product) => (
              <article className="collection-product-card" key={product.id}>
                <div className="product-card-top">
                  <span>{product.badge}</span>
                  <button
                    type="button"
                    className={wishlist.has(product.id) ? 'is-active' : ''}
                    aria-label={`Wishlist ${product.name}`}
                    onClick={() => toggleWishlist(product)}
                  >
                    <FiHeart aria-hidden="true" />
                  </button>
                </div>
                <Link className="collection-product-image" to={`/products/${product.id}`}>
                  <img src={product.image} alt={product.name} />
                </Link>
                <div className="collection-product-info">
                  <div>
                    <h2>{product.name}</h2>
                    <p>{formatAstraviaPrice(product.price)}</p>
                  </div>
                  <Link className="product-arrow-link" to={`/products/${product.id}`} aria-label={`View ${product.name}`}>
                    &rarr;
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {!visibleProducts.length && <div className="collection-empty">No tees match those filters.</div>}
        </div>
      </div>

      <div className={`filter-drawer ${drawerOpen ? 'is-open' : ''}`} aria-hidden={!drawerOpen}>
        <button className="filter-drawer-backdrop" type="button" aria-label="Close filters" onClick={() => setDrawerOpen(false)} />
        <div className="filter-drawer-panel">
          <button className="filter-drawer-close" type="button" onClick={() => setDrawerOpen(false)}>Close</button>
          {filterPanel}
        </div>
      </div>
    </section>
  );
}
