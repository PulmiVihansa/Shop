import { useMemo, useRef, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import useProducts from '../hooks/useProducts.js';
import { createCartItem, getProductId, getProductSizes } from '../utils/cartProduct.js';
import '../styles/newarrivals.css';

const fallbackProducts = [];

const heroCards = [
  {
    id: 'hero-coat',
    badge: 'Just In',
    name: 'Draped Linen Coat',
    price: 490,
    bgClass: 'b1',
    span: 2,
  },
  {
    id: 'hero-blouse',
    badge: 'New',
    name: 'Silk Pliss\u00E9 Blouse',
    price: 285,
    bgClass: 'b2',
  },
  {
    id: 'hero-dress',
    badge: 'New',
    name: 'Broderie Midi Dress',
    price: 395,
    bgClass: 'b3',
  },
];

const editorialPicks = [
  {
    id: 'editorial-coat',
    badge: 'Just In',
    badgeClass: 'ec-new',
    name: 'Draped Linen Coat',
    price: 490,
    bgClass: 'b1',
    productId: 'draped-linen-coat',
  },
  {
    id: 'editorial-dress',
    badge: 'New',
    badgeClass: 'ec-new',
    name: 'Broderie Midi Dress',
    price: 395,
    bgClass: 'b6',
    productId: 'broderie-midi-dress',
  },
  {
    id: 'editorial-knit',
    badge: 'Limited',
    badgeClass: 'ec-ltd',
    name: 'Cashmere Roll-Neck',
    price: 380,
    bgClass: 'b9',
    productId: 'cashmere-roll-neck',
  },
];

const marqueeItems = [
  'SS26 Collection',
  '12 new pieces',
  'Linen \u00B7 Silk \u00B7 Cotton \u00B7 Cashmere',
  'Sourced within 200km of Paris',
  'Lifetime repair guarantee',
];

const formatCurrency = (value) => `LKR${value.toLocaleString()}`;

export default function NewArrivals() {
  const { addItem } = useCart();
  const { products } = useProducts({ fallback: fallbackProducts });
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('new');
  const [toast, setToast] = useState('');
  const [wishlist, setWishlist] = useState(() => new Set());
  const toastTimer = useRef(null);
  const [selectedSizes, setSelectedSizes] = useState({});

  const showToast = (message) => {
    setToast(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(''), 2700);
  };

  const handleAddToBag = (product) => {
    if (!product) return;
    const productId = getProductId(product);
    const size = selectedSizes[productId];
    if (!size) {
      showToast('Please select a size');
      return;
    }
    addItem(createCartItem(product, size));
    showToast(`Added: ${product.name}`);
  };

  const toggleWishlist = (event, product) => {
    event.stopPropagation();
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
        showToast(`Removed: ${product.name}`);
      } else {
        next.add(product.id);
        showToast(`Saved to wishlist: ${product.name}`);
      }
      return next;
    });
  };

  const quickView = (event, product) => {
    event.stopPropagation();
    showToast(`Quick view \u2014 ${product.name}`);
  };

  const handleSizeSelect = (productId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const visibleProducts = useMemo(() => {
    let list = [...products];
    if (filter !== 'all') {
      list = list.filter((product) => product.collection === filter);
    }
    if (sort === 'low') {
      list.sort((a, b) => a.price - b.price);
    }
    if (sort === 'high') {
      list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [filter, products, sort]);

  const pieceCount = visibleProducts.length;
  const marqueeLoop = [...marqueeItems, ...marqueeItems];

  return (
    <div className="new-arrivals">
      <section className="hero">
        <div className="hl">
          <div className="h-in">
            <div className="h-ey">Spring / Summer 2026</div>
            <h1 className="h-t">
              New
              <br />
              <em>Arrivals</em>
            </h1>
            <p className="h-desc">
              Twelve new pieces, each cut by hand from fabric sourced within 200km of our Paris atelier. Designed for
              movement. Made to last a lifetime.
            </p>
            <div className="h-btns">
              <a href="#arrivals" className="h-btn1">
                Shop All Arrivals
              </a>
              <a href="#" className="h-btn2">
                View SS26 Lookbook
              </a>
            </div>
          </div>
        </div>
        <div className="hr">
          {heroCards.map((card) => (
            <div key={card.id} className="hc" style={card.span ? { gridRow: 'span 2' } : undefined}>
              <div className={`hcbg ${card.bgClass}`} />
              <span className="hc-badge">{card.badge}</span>
              <div className="hc-info">
                <div className="hc-n">{card.name}</div>
                <div className="hc-p">{formatCurrency(card.price)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mbar" style={{ background: 'var(--te)' }} aria-hidden="true">
        <div className="mi">
          {marqueeLoop.map((item, index) => (
            <span key={`${item}-${index}`} className="mt" style={{ fontSize: '.85rem', color: 'var(--cr)' }}>
              {item}
              <span className="md" style={{ background: 'rgba(250,247,242,.4)' }} />
            </span>
          ))}
        </div>
      </div>

      <div className="ed-sec" id="arrivals">
        <div className="ed-label">Editor's Picks</div>
        <div className="ed-grid">
          <div className="ec main">
            <div className="ec-img">
              <div className={`ec-ibg ${editorialPicks[0].bgClass}`} />
              <div className="ec-ov" />
            </div>
            <span className={`ec-badge ${editorialPicks[0].badgeClass}`}>{editorialPicks[0].badge}</span>
            <div className="ec-inf">
              <div className="ec-n">{editorialPicks[0].name}</div>
              <div className="ec-p">{formatCurrency(editorialPicks[0].price)}</div>
              <button
                className="ec-btn"
                type="button"
                onClick={() =>
                  handleAddToBag(products.find((entry) => entry.id === editorialPicks[0].productId))
                }
              >
                Quick Add
              </button>
            </div>
          </div>
          <div className="ec-rcol">
            {editorialPicks.slice(1).map((pick) => {
              const product = products.find((entry) => entry.id === pick.productId);
              return (
                <div key={pick.id} className="ec side">
                  <div className="ec-img">
                    <div className={`ec-ibg ${pick.bgClass}`} />
                    <div className="ec-ov" />
                  </div>
                  <span className={`ec-badge ${pick.badgeClass}`}>{pick.badge}</span>
                  <div className="ec-inf">
                    <div className="ec-n">{pick.name}</div>
                    <div className="ec-p">{formatCurrency(pick.price)}</div>
                    <button className="ec-btn" type="button" onClick={() => handleAddToBag(product)}>
                      Quick Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fbar">
        <div className="ftabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'female', label: 'Women' },
            { key: 'male', label: 'Men' },
            { key: 'accessories', label: 'Accessories' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`ft ${filter === tab.key ? 'on' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="fbar-r">
          <span className="fcount">
            {pieceCount} piece{pieceCount === 1 ? '' : 's'}
          </span>
          <select className="fsort" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="new">Newest First</option>
            <option value="low">Price: Low\u2013High</option>
            <option value="high">Price: High\u2013Low</option>
          </select>
        </div>
      </div>

      <section className="grid-sec">
        <div className="grid-hd">
          All New Arrivals <small>\u2014 Spring / Summer 2026</small>
        </div>
        <div className="pgrid">
          {visibleProducts.map((product) => (
            <div key={product.id} className="pc">
              <div className="pci">
                <ProductVisual product={product} />
                <div className="pc-acts">
                  <button
                    className={`pa ${wishlist.has(product.id) ? 'is-active' : ''}`}
                    type="button"
                    aria-label="Save to wishlist"
                    onClick={(event) => toggleWishlist(event, product)}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                  </button>
                  <button
                    className="pa"
                    type="button"
                    aria-label="Quick view"
                    onClick={(event) => quickView(event, product)}
                  >
                    <svg viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                </div>
                <div className="pc-bar">
                  <div className="pc-szs">
                    {getProductSizes(product).map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={`sz ${selectedSizes[product.id] === size ? 'on' : ''}`}
                        onClick={() => handleSizeSelect(product.id, size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <button className="add-btn" type="button" onClick={() => handleAddToBag(product)}>
                    Add to Bag
                  </button>
                </div>
              </div>
              <div className="pinfo">
                <div className="pcat">{product.categoryLabel}</div>
                <div className="pname">{product.name}</div>
                <div className="pprice">{formatCurrency(product.price)}</div>
                <div className="pswatches">
                  {(Array.isArray(product.colors) ? product.colors : []).map((color) => (
                    <span
                      key={color}
                      className="swatch"
                      style={{
                        background: color,
                        borderColor: color.toLowerCase() === '#faf7f2' ? '#D4CDC5' : 'transparent',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}

