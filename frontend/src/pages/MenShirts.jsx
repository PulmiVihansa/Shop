import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import useProducts from '../hooks/useProducts.js';
import { createCartItem, getProductId, getProductSizes } from '../utils/cartProduct.js';
import '../styles/men-shirts.css';

const heroPanels = [
  {
    id: 'hero-01',
    number: '01',
    label: 'Bestseller',
    name: 'Linen Oxford Shirt',
    price: 210,
    bgClass: 'b5',
  },
  {
    id: 'hero-02',
    number: '02',
    label: 'New',
    name: 'Poplin Band Collar',
    price: 185,
    bgClass: 'b7',
  },
  {
    id: 'hero-03',
    number: '03',
    label: 'Limited',
    name: 'Chambray Overshirt',
    price: 240,
    bgClass: 'bdark',
  },
];

const marqueeItems = [
  'The Shirt Edit — SS26',
  'European Linen · Poplin · Chambray · Oxford Cloth',
  'Mother of pearl buttons',
  'Hand-finished collars',
];

const storyFeatures = [
  { value: '12', label: 'Shirt Styles' },
  { value: '4', label: 'Fabrics' },
  { value: 'MOP', label: 'Pearl Buttons' },
];

const formatCurrency = (value) => `LKR${value.toLocaleString()}`;

export default function MenShirts() {
  const { addItem } = useCart();
  const { products, loading, error } = useProducts({ collection: 'male', category: 'Shirts' });
  const navigate = useNavigate();
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
    showToast(`Quick view — ${product.name}`);
  };

  const handleSizeSelect = (productId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const openProduct = (productId) => {
    if (productId) navigate(`/products/${productId}`);
  };

  const visibleProducts = useMemo(() => {
    let list = [...products];
    if (filter !== 'all') {
      list = list.filter((product) => product.subcategory === filter);
    }
    if (sort === 'low') {
      list.sort((a, b) => a.price - b.price);
    }
    if (sort === 'high') {
      list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [filter, products, sort]);

  const shirtCount = visibleProducts.length;
  const marqueeLoop = [...marqueeItems, ...marqueeItems];

  return (
    <div className="men-shirts">
      <section className="hero">
        <div className="hero-title-bar">
          <div className="hero-eyebrow">Men&apos;s Shirts — SS26</div>
          <h1>
            The
            <br />
            <em>Shirt</em>
            <br />
            Edit
          </h1>
        </div>
        {heroPanels.map((panel) => (
          <div key={panel.id} className="hpanel">
            <div className={`hpanel-bg ${panel.bgClass}`} />
            <div className="hpanel-overlay" />
            <div className="hpanel-content">
              <div className="hpanel-num">{panel.number}</div>
              <div className="hpanel-label">{panel.label}</div>
              <div className="hpanel-name">{panel.name}</div>
              <div className="hpanel-price">{formatCurrency(panel.price)}</div>
            </div>
          </div>
        ))}
      </section>

      <div className="mbar" aria-hidden="true">
        <div className="mi">
          {marqueeLoop.map((item, index) => (
            <span key={`${item}-${index}`} className="mt">
              {item}
              <span className="md" />
            </span>
          ))}
        </div>
      </div>

      <section className="story" id="shirts">
        <div className="story-text">
          <div className="story-eyebrow">The Making Of</div>
          <div className="story-title">
            Fabric first,
            <br />
            <em>always</em>
          </div>
          <p className="story-body">
            Every shirt in our collection begins as a bolt of cloth within 200km of our Paris atelier. We work
            exclusively with artisan weavers who still finish selvedges by hand. The result is a shirt that drapes
            differently — softer, more considered, unmistakably alive.
          </p>
          <div className="story-features">
            {storyFeatures.map((feature) => (
              <div key={feature.label} className="sf">
                <div className="sf-val">{feature.value}</div>
                <div className="sf-lbl">{feature.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="story-img">
          <div className="story-img-bg" />
          <div className="story-img-tag">
            <span>Sourced within 200km · Paris</span>
          </div>
        </div>
      </section>

      <div className="fbar">
        <div className="ftabs">
          {[
            { key: 'all', label: 'All Shirts' },
            { key: 'Linen', label: 'Linen' },
            { key: 'Poplin', label: 'Poplin' },
            { key: 'Chambray', label: 'Chambray' },
            { key: 'Oxford', label: 'Oxford' },
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
            {shirtCount} shirt{shirtCount === 1 ? '' : 's'}
          </span>
          <select className="fsort" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="new">Newest First</option>
            <option value="low">Price: Low–High</option>
            <option value="high">Price: High–Low</option>
          </select>
        </div>
      </div>

      <div className="size-cta">
        <div className="size-cta-text">
          <div className="size-cta-title">Not sure of your fit?</div>
          <div className="size-cta-sub">
            Our tailors recommend measuring chest, collar, and sleeve for the perfect shirt.
          </div>
        </div>
        <button className="size-cta-btn" type="button" onClick={() => showToast('Size guide opened')}>
          View Size Guide
        </button>
      </div>

      {loading && <div className="grid-sec"><div className="grid-hd">Loading shirts...</div></div>}
      {!loading && error && <div className="grid-sec"><div className="grid-hd">{error}</div></div>}
      {!loading && !error && visibleProducts.length === 0 && <div className="grid-sec"><div className="grid-hd">No shirts found.</div></div>}

      <section className="grid-sec">
        <div className="grid-hd">
          Men&apos;s Shirts <small>— Spring / Summer 2026</small>
        </div>
        <div className="pgrid">
          {visibleProducts.map((product) => (
            <div
              key={product.id}
              className="pc"
              role="button"
              tabIndex={0}
              onClick={() => openProduct(product.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openProduct(product.id);
                }
              }}
            >
              <div className="pci">
                <ProductVisual product={product} />
                <div className="pc-acts">
                  <button
                    className={`pa ${wishlist.has(product.id) ? 'is-active' : ''}`}
                    type="button"
                    aria-label="Save to wishlist"
                    onClick={(event) => toggleWishlist(event, product)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                  </button>
                  <button
                    className="pa"
                    type="button"
                    aria-label="Quick view"
                    onClick={(event) => quickView(event, product)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
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
                    className="add-btn"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleAddToBag(product);
                    }}
                  >
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

