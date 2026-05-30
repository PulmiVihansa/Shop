import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import useProducts from '../hooks/useProducts.js';
import usePageContent from '../hooks/usePageContent.js';
import '../styles/men-trousers.css';

const sidebarItems = [
  { id: 'side-chino', name: 'Twill Chino', price: 290, tag: 'Bestseller', productId: 'twill-chino-trousers' },
  { id: 'side-linen', name: 'Linen Wide Leg', price: 260, tag: 'New', productId: 'linen-wide-trousers' },
  {
    id: 'side-wool',
    name: 'Tailored Wool',
    price: 370,
    tag: 'Limited',
    tagClass: 'is-dark',
    productId: 'tailored-wool-trouser',
  },
  {
    id: 'side-jersey',
    name: 'Jersey Drawstring',
    price: 185,
    tag: 'New',
    productId: 'jersey-drawstring-trousers',
  },
];

const fitGuides = [
  {
    key: 'slim',
    badge: 'Most Popular',
    number: '01',
    name: 'Slim Tapered',
    description: 'Cut close through the hip and thigh with a gradual taper to the ankle. Clean, modern and versatile.',
  },
  {
    key: 'wide',
    number: '02',
    name: 'Relaxed Wide',
    description: 'A generous cut through the leg with a straight fall. Easy to wear, effortlessly elegant in motion.',
  },
  {
    key: 'tailored',
    number: '03',
    name: 'Tailored Straight',
    description: 'The classic silhouette. A structured waistband, straight leg, and clean break above the shoe.',
  },
];

const marqueeItems = [
  'The Trouser Edit — SS26',
  'Linen · Twill · Merino Wool · Jersey',
  'Free hemming on every pair',
  'Cut on the bias for movement',
];

const fallbackProducts = [
  {
    id: 'twill-chino-trousers',
    name: 'Twill Chino Trousers',
    category: 'slim',
    categoryLabel: 'Slim Tapered',
    price: 290,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b4',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultSize: 'M',
    swatches: ['#C8BAB0', '#1A1A1A', '#A8B8A0'],
    imageClass: 'cotton',
  },
  {
    id: 'linen-wide-trousers',
    name: 'Linen Wide Trousers',
    category: 'wide',
    categoryLabel: 'Wide Leg',
    price: 260,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b1',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultSize: 'L',
    swatches: ['#C8BAB0', '#AEB8C2'],
    imageClass: 'linen',
  },
  {
    id: 'tailored-wool-trouser',
    name: 'Tailored Wool Trouser',
    category: 'tailored',
    categoryLabel: 'Tailored',
    price: 370,
    badge: 'pltd',
    badgeText: 'Limited',
    bgClass: 'bdark',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultSize: 'M',
    swatches: ['#1A1A1A', '#C8BAB0'],
    imageClass: 'wool',
  },
  {
    id: 'jersey-drawstring-trousers',
    name: 'Jersey Drawstring Trousers',
    category: 'casual',
    categoryLabel: 'Casual',
    price: 185,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b9',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultSize: 'S',
    swatches: ['#B8C2AA', '#C8BAB0', '#1A1A1A'],
    imageClass: 'cotton',
  },
  {
    id: 'cotton-slim-chino',
    name: 'Cotton Slim Chino',
    category: 'slim',
    categoryLabel: 'Slim Tapered',
    price: 245,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b5',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultSize: 'M',
    swatches: ['#AEB8C2', '#C6AEA0'],
    imageClass: 'cotton',
  },
  {
    id: 'pleated-wide-trousers',
    name: 'Pleated Wide Trousers',
    category: 'wide',
    categoryLabel: 'Wide Leg',
    price: 310,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b6',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultSize: 'L',
    swatches: ['#C6AEA0', '#1A1A1A'],
    imageClass: 'linen',
  },
];

const formatCurrency = (value) => `LKR${value.toLocaleString()}`;

export default function MenTrousers() {
  const content = usePageContent('menTrousers');
  const { addItem } = useCart();
  const { products } = useProducts({ fallback: fallbackProducts, placement: 'men' });
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('new');
  const [toast, setToast] = useState('');
  const [wishlist, setWishlist] = useState(() => new Set());
  const toastTimer = useRef(null);
  const [selectedSizes, setSelectedSizes] = useState(() =>
    fallbackProducts.reduce((acc, product) => {
      if (product.sizes?.length) {
        acc[product.id] = product.defaultSize || product.sizes[0];
      }
      return acc;
    }, {})
  );

  useEffect(() => {
    setSelectedSizes((prev) =>
      products.reduce((acc, product) => {
        if (product.sizes?.length && !acc[product.id]) {
          acc[product.id] = product.defaultSize || product.sizes[0];
        }
        return acc;
      }, { ...prev })
    );
  }, [products]);

  const showToast = (message) => {
    setToast(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(''), 2700);
  };

  const handleAddToBag = (product) => {
    if (!product) return;
    const size = selectedSizes[product.id];
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      size,
      imageClass: product.imageClass,
    });
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

  const visibleProducts = useMemo(() => {
    let list = [...products];
    if (filter !== 'all') {
      list = list.filter((product) => product.category === filter);
    }
    if (sort === 'low') {
      list.sort((a, b) => a.price - b.price);
    }
    if (sort === 'high') {
      list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, filter, sort]);

  const styleCount = visibleProducts.length;
  const marqueeLoop = [...marqueeItems, ...marqueeItems];

  return (
    <div className="men-trousers">
      <section className="hero">
        <div className="hl">
          <div className="hl-bg" />
          <div className="hl-overlay" />
          <div className="hl-content">
            <div className="h-ey">Spring / Summer 2026</div>
            <h1 className="h-t">
              The
              <br />
              Perfect
              <br />
              <em>Trouser</em>
            </h1>
            <p className="h-desc">
              Tailored from the finest European wools, linens, and twills. Each pair is cut with a generous rise and
              tapered leg — the ideal proportion for any frame.
            </p>
            <div className="h-btns">
              <a href="#trousers" className="h-btn1">
                Shop All
              </a>
              <a href="/sizeguide" className="h-btn2">
                Fit Guide
              </a>
            </div>
          </div>
        </div>
        <aside className="hr">
          <div className="hr-top">
            <div className="hr-label">{content.seasonLabel}</div>
            {sidebarItems.map((item) => {
              const product = products.find((entry) => entry.id === item.productId);
              return (
                <button key={item.id} className="hr-item" type="button" onClick={() => handleAddToBag(product)}>
                  <span>
                    <span className="hr-item-name">{item.name}</span>
                    <span className="hr-item-price">{formatCurrency(item.price)}</span>
                  </span>
                  <span className={`hr-item-tag ${item.tagClass || ''}`}>{item.tag}</span>
                </button>
              );
            })}
          </div>
          <div className="hr-bottom">
            <div className="hr-bottom-title">{content.hemmingTitle}</div>
            <div className="hr-bottom-sub">
              Every pair is hemmed to your exact inseam. Simply note your measurement at checkout.
            </div>
            <button
              className="hr-bottom-btn"
              type="button"
              onClick={() => showToast("Hemming info — we'll contact you at checkout")}
            >
              Learn More
            </button>
          </div>
        </aside>
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

      <section className="fit-guide" id="trousers">
        {fitGuides.map((fit) => {
          const isActive = filter === fit.key || (filter === 'all' && fit.key === 'slim');
          return (
            <div key={fit.key} className={`fg ${isActive ? 'active' : ''}`}>
              {fit.badge ? <span className="fg-badge">{fit.badge}</span> : null}
              <div className="fg-num">{fit.number}</div>
              <div className="fg-name">{fit.name}</div>
              <p className="fg-desc">{fit.description}</p>
              <button type="button" className="fg-link" onClick={() => setFilter(fit.key)}>
                Shop {fit.key === 'wide' ? 'Wide' : fit.name.split(' ')[0]} <span className="fg-link-arrow">→</span>
              </button>
            </div>
          );
        })}
      </section>

      <div className="fbar">
        <div className="ftabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'slim', label: 'Slim' },
            { key: 'wide', label: 'Wide Leg' },
            { key: 'tailored', label: 'Tailored' },
            { key: 'casual', label: 'Casual' },
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
            {styleCount} style{styleCount === 1 ? '' : 's'}
          </span>
          <select className="fsort" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="new">Newest First</option>
            <option value="low">Price: Low–High</option>
            <option value="high">Price: High–Low</option>
          </select>
        </div>
      </div>

      <section className="grid-sec">
        <div className="grid-hd">
          Men&apos;s Trousers <small>— Spring / Summer 2026</small>
        </div>
        <div className="pgrid">
          {visibleProducts.map((product) => (
            <div key={product.id} className="pc">
              <div className="pci">
                <div className={`pcbg ${product.bgClass}`} />
                {product.images?.[0] && (
                  <img className="pcimg" src={product.images[0]} alt={product.name} loading="lazy" />
                )}
                {product.badgeText && <span className={`pbadge ${product.badge}`}>{product.badgeText}</span>}
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
                    {product.sizes.map((size) => (
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
                  {product.swatches.map((color) => (
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
