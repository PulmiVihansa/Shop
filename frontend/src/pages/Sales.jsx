import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import useProducts from '../hooks/useProducts.js';
import { createCartItem, getProductId, getProductSizes } from '../utils/cartProduct.js';
import '../styles/sales.css';

const fallbackProducts = [];

const marqueeItems = [
  'Up to 60% off',
  'Free delivery',
  'Limited stock',
  'Final reductions',
  'Lifetime repair guarantee',
  'Artisan crafted',
  'Spring / Summer 2025',
];

const formatCurrency = (value) => `LKR${value.toLocaleString()}`;

export default function Sales() {
  const { addItem, openCart } = useCart();
  const { products } = useProducts({ fallback: fallbackProducts, tag: 'sale' });
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('disc');
  const [activePill, setActivePill] = useState('Women');
  const [toast, setToast] = useState('');
  const [wishlist, setWishlist] = useState(() => new Set());
  const [stickyItem, setStickyItem] = useState(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [countdown, setCountdown] = useState({
    days: '00',
    hours: '00',
    mins: '00',
    secs: '00',
  });
  const toastTimer = useRef(null);

  const [selectedSizes, setSelectedSizes] = useState({});

  useEffect(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    endDate.setHours(endDate.getHours() + 14);
    endDate.setMinutes(endDate.getMinutes() + 28);

    const tick = () => {
                const diff = Math.max(0, endDate - now);
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      const pad = (value) => String(value).padStart(2, '0');

      setCountdown({
        days: pad(days),
        hours: pad(hours),
        mins: pad(mins),
        secs: pad(secs),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message) => {
    setToast(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  };

  const handleAddToBag = (product) => {
    if (!product || product.soldOut) return;
    const productId = getProductId(product);
    const size = selectedSizes[productId];
    if (!size) {
      showToast('Please select a size');
      return;
    }
    addItem(createCartItem(product, size));
    openCart();
    showToast(`${product.name} added to bag - ${formatCurrency(product.price)}`);
  };

  const toggleWishlist = (event, product) => {
    event.stopPropagation();
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
        showToast(`${product.name} removed from wishlist`);
      } else {
        next.add(product.id);
        showToast(`${product.name} saved to wishlist`);
      }
      return next;
    });
  };

  const quickView = (event, product) => {
    event.stopPropagation();
    showToast(`Quick view: ${product.name}`);
  };

  const handleSizeSelect = (productId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const handleCardHover = (product) => {
    if (!product || product.soldOut) return;
    setStickyItem(product);
    setStickyVisible(true);
  };

  const visibleProducts = useMemo(() => {
    let list = [...products];
    if (filter !== 'all') {
      list = list.filter((product) => product.collection === filter);
    }

    if (sort === 'disc') {
      list.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    }
    if (sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    }
    if (sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    }
    if (sort === 'new') {
      list.sort((a, b) => {
        const aNew = a.isNew ? 1 : 0;
        const bNew = b.isNew ? 1 : 0;
        if (aNew !== bNew) return bNew - aNew;
        return String(a.id).localeCompare(String(b.id));
      });
    }

    return list;
  }, [filter, products, sort]);

  const resultCount = visibleProducts.length;
  const marqueeLoop = [...marqueeItems, ...marqueeItems];
  const stickySizes = stickyItem ? getProductSizes(stickyItem) : [];
  const stickySize = stickyItem ? selectedSizes[stickyItem.id] : null;

  return (
    <div className="sales-page">
      <div className="announce-bar">
        Free delivery on all sale orders - No minimum spend - Limited stock - shop now
      </div>

      <section className="hero">
        <div className="hero-bg-text" aria-hidden="true">
          SALE
        </div>
        <div className="hero-eyebrow">End of Season</div>
        <h1 className="hero-title">
          Up to
          <br />
          <em>60% Off</em>
        </h1>

        <div className="hero-discount-row">
          {['Women', 'Men', 'Accessories', 'Final Reductions'].map((pill) => (
            <button
              key={pill}
              type="button"
              className={`hero-disc-pill ${activePill === pill ? 'active' : ''}`}
              onClick={() => setActivePill(pill)}
            >
              {pill}
            </button>
          ))}
        </div>

        <p className="hero-subtitle">
          Carefully selected pieces from our previous seasons - same artisan quality, at a fraction of the price.
          Stock is strictly limited.
        </p>

        <div className="countdown-wrap">
          <div className="countdown-label">Sale ends in</div>
          <div className="countdown">
            <div className="cd-unit">
              <div className="cd-num">{countdown.days}</div>
              <span className="cd-lbl">Days</span>
            </div>
            <div className="cd-sep">:</div>
            <div className="cd-unit">
              <div className="cd-num">{countdown.hours}</div>
              <span className="cd-lbl">Hours</span>
            </div>
            <div className="cd-sep">:</div>
            <div className="cd-unit">
              <div className="cd-num">{countdown.mins}</div>
              <span className="cd-lbl">Mins</span>
            </div>
            <div className="cd-sep">:</div>
            <div className="cd-unit">
              <div className="cd-num">{countdown.secs}</div>
              <span className="cd-lbl">Secs</span>
            </div>
          </div>
        </div>

        <div className="hero-cta-row">
          <a href="#sales-products" className="cta-primary">
            Shop the Sale
          </a>
          <a href="#" className="cta-ghost">
            View Lookbook
          </a>
        </div>
      </section>

      <div className="marquee-bar" aria-hidden="true">
        <div className="marquee-inner">
          {marqueeLoop.map((item, index) => (
            <span key={`${item}-${index}`} className="marquee-item">
              {item}
              <span className="marquee-dot" />
            </span>
          ))}
        </div>
      </div>

      <div className="stats-strip">
        <div className="stat-cell">
          <div className="stat-val">140+</div>
          <div className="stat-lbl">Pieces on sale</div>
        </div>
        <div className="stat-cell">
          <div className="stat-val">60%</div>
          <div className="stat-lbl">Max discount</div>
        </div>
        <div className="stat-cell">
          <div className="stat-val">3 days</div>
          <div className="stat-lbl">Remaining</div>
        </div>
        <div className="stat-cell">
          <div className="stat-val">Free</div>
          <div className="stat-lbl">Delivery & returns</div>
        </div>
      </div>

      <div className="filter-section" id="sales-products">
        <div className="filter-left">
          {[
            { key: 'all', label: 'All' },
            { key: 'female', label: 'Women' },
            { key: 'male', label: 'Men' },
            { key: 'accessories', label: 'Accessories' },
            { key: 'final', label: 'Final Reductions' },
          ].map((btn) => (
            <button
              key={btn.key}
              type="button"
              className={`filter-btn ${filter === btn.key ? 'active' : ''}`}
              onClick={() => setFilter(btn.key)}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="filter-right">
          <span className="result-count">
            {resultCount} {resultCount === 1 ? 'piece' : 'pieces'}
          </span>
          <select className="sort-sel" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="disc">Biggest Discount</option>
            <option value="price-asc">Price: Low-High</option>
            <option value="price-desc">Price: High-Low</option>
            <option value="new">Newest First</option>
          </select>
        </div>
      </div>

      <div className="promo-banner">
        <div>
          <div className="promo-tag">Members only</div>
          <div className="promo-headline">
            An <em>extra 20%</em> off
            <br />
            your first sale order
          </div>
          <p className="promo-sub">
            Use code <strong>ATELIER20</strong> at checkout - One use per account
          </p>
        </div>
        <button
          className="promo-cta"
          type="button"
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText('ATELIER20');
            }
            showToast('Code ATELIER20 copied - paste at checkout');
          }}
        >
          Copy Code
        </button>
      </div>

      <section className="product-section">
        <div className="product-grid">
          {visibleProducts.map((product, index) => (
            <div
              key={product.id}
              className={`prod-card ${product.featured ? 'featured' : ''}`}
              style={{ animationDelay: `${index * 0.05}s` }}
              onMouseEnter={() => handleCardHover(product)}
            >
              {!product.soldOut && (
                <div className="card-actions">
                  <button
                    className={`card-action-btn ${wishlist.has(product.id) ? 'is-active' : ''}`}
                    type="button"
                    onClick={(event) => toggleWishlist(event, product)}
                    aria-label="Add to wishlist"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                  </button>
                  <button
                    className="card-action-btn"
                    type="button"
                    onClick={(event) => quickView(event, product)}
                    aria-label="Quick view"
                  >
                    <svg viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="card-image">
                <ProductVisual product={product} className="card-img-bg" />
                <span className="card-img-label">{product.label || product.name}</span>

                {product.soldOut && (
                  <div className="sold-overlay">
                    <span className="sold-label">Sold Out</span>
                  </div>
                )}

                {!product.soldOut && (
                  <div className="card-hover-bar">
                    <div className="hover-bar-sizes">
                      {getProductSizes(product).map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={`hover-size ${selectedSizes[product.id] === size ? 'sel' : ''}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleSizeSelect(product.id, size);
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <button
                      className="hover-add-btn"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAddToBag(product);
                      }}
                    >
                      Add to Bag - {formatCurrency(product.price)}
                    </button>
                  </div>
                )}
              </div>

              <div className="card-info">
                <div className="card-cat">{product.cardCategory || `${product.collection} / ${product.category}`}</div>
                <div className="card-name">{product.name}</div>
                <div className="card-pricing">
                  <span className={`price-sale ${product.soldOut ? 'is-muted' : ''}`}>
                    {formatCurrency(product.price)}
                  </span>
                  <span className="price-orig">{formatCurrency(product.originalPrice || product.price)}</span>
                  <span className="price-saving">
                    {product.soldOut
                      ? 'Sold out'
                      : `You save ${formatCurrency((product.originalPrice || product.price) - product.price)}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={`sticky-bar ${stickyVisible ? 'visible' : ''}`}>
        <div className="sticky-bar-left">
          <div className="sticky-bar-icon">
            <svg viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <div>
            <div className="sticky-item-name">{stickyItem ? stickyItem.name : 'Select a piece'}</div>
            <div className="sticky-item-price">
              {stickyItem ? formatCurrency(stickyItem.price) : ' '}
            </div>
          </div>
        </div>
        <div className="sticky-bar-right">
          <div className="sticky-sizes">
            {stickySizes.map((size) => (
              <button
                key={size}
                type="button"
                className={`sticky-size ${stickySize === size ? 'sel' : ''}`}
                onClick={() => stickyItem && handleSizeSelect(stickyItem.id, size)}
              >
                {size}
              </button>
            ))}
          </div>
          <button
            className="sticky-add"
            type="button"
            disabled={!stickyItem}
            onClick={() => handleAddToBag(stickyItem)}
          >
            Add to Bag
          </button>
          <button
            className="sticky-close"
            type="button"
            onClick={() => setStickyVisible(false)}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>
        <span className="toast-dot" />
        <span>{toast}</span>
      </div>
    </div>
  );
}

