import { useMemo, useRef, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import '../styles/accessories.css';

const heroFeature = {
  badge: 'Just In',
  category: 'Bags',
  name: 'Raffia Structured Tote',
  price: 175,
  bgClass: 'b1',
  productId: 'raffia-structured-tote',
};

const heroMini = [
  { id: 'mini-belt', tag: 'New', tagClass: 'tag-new', name: 'Woven Leather Belt', price: 95, bgClass: 'b6' },
  { id: 'mini-scarf', tag: 'New', tagClass: 'tag-new', name: 'Silk Scarf — Botanical', price: 145, bgClass: 'b3' },
  {
    id: 'mini-holder',
    tag: 'Limited',
    tagClass: 'tag-ltd',
    name: 'Leather Card Holder',
    price: 80,
    bgClass: 'bdark',
  },
];

const marqueeItems = [
  'The Accessories Edit — SS26',
  'Leather · Raffia · Silk · Cashmere',
  'Hand-stitched in small batches',
  'Each piece numbered',
  'Free gift wrapping on all orders',
];

const categories = [
  {
    key: 'all',
    label: 'All',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="1" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
  },
  {
    key: 'bags',
    label: 'Bags',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    key: 'belts',
    label: 'Belts',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="1" y="9" width="22" height="6" rx="2" />
        <path d="M8 12h2" />
      </svg>
    ),
  },
  {
    key: 'scarves',
    label: 'Scarves',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10" />
        <path d="M12 2c2 4 2 8 0 12s-2 8 0 10" />
      </svg>
    ),
  },
  {
    key: 'small',
    label: 'Small Leather',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
];

const editorialStrip = {
  main: {
    badge: "Editor's Choice",
    badgeClass: 'es-badge-te',
    name: 'Raffia Structured Tote',
    price: 175,
    category: 'Bags',
    bgClass: 'b4',
    productId: 'raffia-structured-tote',
  },
  side: [
    { id: 'es-belt', tag: 'Belts — New', name: 'Woven Leather Belt', price: 95, productId: 'woven-leather-belt' },
    {
      id: 'es-scarf',
      tag: 'Scarves — New',
      name: 'Silk Scarf — Botanical',
      price: 145,
      productId: 'silk-scarf-botanical',
    },
    {
      id: 'es-holder',
      tag: 'Small Leather — Limited',
      name: 'Leather Card Holder',
      price: 80,
      productId: 'leather-card-holder',
    },
    { id: 'es-tote', tag: 'Bags — New', name: 'Canvas Weekend Tote', price: 210, productId: 'canvas-weekend-tote' },
  ],
};

const products = [
  {
    id: 'raffia-structured-tote',
    name: 'Raffia Structured Tote',
    category: 'bags',
    categoryLabel: 'Bags',
    price: 175,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b1',
    swatches: ['#C8BAB0', '#1A1A1A'],
    imageClass: 'linen',
  },
  {
    id: 'canvas-weekend-tote',
    name: 'Canvas Weekend Tote',
    category: 'bags',
    categoryLabel: 'Bags',
    price: 210,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b4',
    swatches: ['#C0B8A8', '#A8B8A0'],
    imageClass: 'cotton',
  },
  {
    id: 'leather-crossbody-bag',
    name: 'Leather Crossbody Bag',
    category: 'bags',
    categoryLabel: 'Bags',
    price: 320,
    badge: 'pltd',
    badgeText: 'Limited',
    bgClass: 'bdark',
    swatches: ['#1A1A1A', '#C6AEA0'],
    imageClass: 'wool',
  },
  {
    id: 'woven-leather-belt',
    name: 'Woven Leather Belt',
    category: 'belts',
    categoryLabel: 'Belts',
    price: 95,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b6',
    swatches: ['#C8BAB0', '#6B4F3A', '#1A1A1A'],
    imageClass: 'wool',
  },
  {
    id: 'braided-suede-belt',
    name: 'Braided Suede Belt',
    category: 'belts',
    categoryLabel: 'Belts',
    price: 110,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b10',
    swatches: ['#BCADA0', '#1A1A1A'],
    imageClass: 'wool',
  },
  {
    id: 'canvas-web-belt',
    name: 'Canvas Web Belt',
    category: 'belts',
    categoryLabel: 'Belts',
    price: 85,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b12',
    swatches: ['#C4B6A8', '#A6C0B2'],
    imageClass: 'cotton',
  },
  {
    id: 'silk-scarf-botanical',
    name: 'Silk Scarf — Botanical',
    category: 'scarves',
    categoryLabel: 'Scarves',
    price: 145,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b3',
    swatches: ['#B0A8B8', '#A8B8A0'],
    imageClass: 'silk',
  },
  {
    id: 'cashmere-wrap-scarf',
    name: 'Cashmere Wrap Scarf',
    category: 'scarves',
    categoryLabel: 'Scarves',
    price: 190,
    badge: 'pltd',
    badgeText: 'Limited',
    bgClass: 'b7',
    swatches: ['#A6C0B2', '#C8BAB0', '#1A1A1A'],
    imageClass: 'wool',
  },
  {
    id: 'linen-neck-scarf',
    name: 'Linen Neck Scarf',
    category: 'scarves',
    categoryLabel: 'Scarves',
    price: 125,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b8',
    swatches: ['#B6B0C2', '#FAF7F2'],
    imageClass: 'linen',
  },
  {
    id: 'leather-card-holder',
    name: 'Leather Card Holder',
    category: 'small',
    categoryLabel: 'Small Leather',
    price: 80,
    badge: 'pltd',
    badgeText: 'Limited',
    bgClass: 'bdark',
    swatches: ['#1A1A1A', '#C6AEA0', '#6B4F3A'],
    imageClass: 'wool',
  },
  {
    id: 'zip-leather-wallet',
    name: 'Zip Leather Wallet',
    category: 'small',
    categoryLabel: 'Small Leather',
    price: 130,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b5',
    swatches: ['#AEB8C2', '#1A1A1A'],
    imageClass: 'wool',
  },
  {
    id: 'leather-key-fob',
    name: 'Leather Key Fob',
    category: 'small',
    categoryLabel: 'Small Leather',
    price: 65,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b9',
    swatches: ['#B8C2AA', '#6B4F3A', '#C8BAB0'],
    imageClass: 'wool',
  },
];

const craftItems = [
  {
    id: 'craft-life',
    title: 'Lifetime Guarantee',
    body: 'Every accessory is repaired or replaced, no questions asked.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: 'craft-source',
    title: 'Sourced within 200km',
    body: 'All leathers, silks, and fibres from artisans near our Paris atelier.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    id: 'craft-delivery',
    title: 'Free Delivery & Returns',
    body: 'Complimentary shipping on all orders. 30-day hassle-free returns.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h6l3 4v4h-9V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    id: 'craft-gift',
    title: 'Gift Wrapping',
    body: 'Every order arrives in our signature tissue and ribbon packaging.',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
];

const formatCurrency = (value) => `LKR${value.toLocaleString()}`;

export default function Accessories() {
  const { addItem } = useCart();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('new');
  const [toast, setToast] = useState('');
  const [wishlist, setWishlist] = useState(() => new Set());
  const toastTimer = useRef(null);

  const showToast = (message) => {
    setToast(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(''), 2700);
  };

  const handleAddToBag = (product) => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
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
        showToast(`Saved: ${product.name}`);
      }
      return next;
    });
  };

  const quickView = (event, product) => {
    event.stopPropagation();
    showToast(`Quick view — ${product.name}`);
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
  }, [filter, sort]);

  const pieceCount = visibleProducts.length;
  const marqueeLoop = [...marqueeItems, ...marqueeItems];
  const categoryCounts = useMemo(() => {
    const counts = products.reduce(
      (acc, product) => {
        acc[product.category] += 1;
        return acc;
      },
      { bags: 0, belts: 0, scarves: 0, small: 0 }
    );
    return { ...counts, all: products.length };
  }, []);

  const featureProduct = products.find((product) => product.id === heroFeature.productId);
  const editorialMain = products.find((product) => product.id === editorialStrip.main.productId);

  return (
    <div className="accessories">
      <section className="hero">
        <div className="h-text-panel">
          <div className="h-text-inner">
            <div className="h-eyebrow">The Finishing Touch — SS26</div>
            <h1 className="h-t">
              The
              <br />
              Art of
              <br />
              <em>Detail</em>
            </h1>
            <p className="h-desc">
              Each accessory is conceived as the final note of an outfit — considered, hand-finished, and crafted to
              elevate everything it touches.
            </p>
            <div className="h-btns">
              <a href="#acc-grid" className="h-btn1">
                Shop All
              </a>
              <a href="#" className="h-btn2">
                SS26 Lookbook
              </a>
            </div>
          </div>
        </div>

        <div className="h-feat">
          <div className={`h-feat-bg ${heroFeature.bgClass}`} />
          <div className="h-feat-overlay" />
          <span className="h-feat-badge">{heroFeature.badge}</span>
          <div className="h-feat-info">
            <div className="h-feat-cat">{heroFeature.category}</div>
            <div className="h-feat-name">{heroFeature.name}</div>
            <div className="h-feat-price">{formatCurrency(heroFeature.price)}</div>
          </div>
          <button
            type="button"
            className="h-feat-action"
            onClick={() => handleAddToBag(featureProduct)}
            aria-label={`Add ${heroFeature.name} to bag`}
          />
        </div>

        <div className="h-stack">
          {heroMini.map((card) => (
            <div key={card.id} className="h-mini">
              <div className={`h-mini-bg ${card.bgClass}`} />
              <div className="h-mini-overlay" />
              <span className={`h-mini-tag ${card.tagClass}`}>{card.tag}</span>
              <div className="h-mini-info">
                <div className="h-mini-name">{card.name}</div>
                <div className="h-mini-price">{formatCurrency(card.price)}</div>
              </div>
            </div>
          ))}
        </div>
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

      <div className="cat-showcase">
        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            className={`catc ${filter === category.key ? 'active' : ''}`}
            onClick={() => setFilter(category.key)}
          >
            <span className="catc-dot" />
            <span className="catc-icon">
              <span className="catc-icon-bg">{category.icon}</span>
            </span>
            <span className="catc-name">{category.label}</span>
            <span className="catc-count">{categoryCounts[category.key]} pieces</span>
          </button>
        ))}
      </div>

      <div className="ed-strip">
        <div className="es-main">
          <div className={`es-bg ${editorialStrip.main.bgClass}`} />
          <div className="es-overlay" />
          <span className={`es-badge ${editorialStrip.main.badgeClass}`}>{editorialStrip.main.badge}</span>
          <div className="es-inf">
            <div className="es-n">{editorialStrip.main.name}</div>
            <div className="es-p">
              {formatCurrency(editorialStrip.main.price)} — {editorialStrip.main.category}
            </div>
            <button className="es-btn" type="button" onClick={() => handleAddToBag(editorialMain)}>
              Quick Add
            </button>
          </div>
        </div>
        {[0, 1].map((idx) => (
          <div key={`es-col-${idx}`} className="es-sidebar">
            {editorialStrip.side.slice(idx * 2, idx * 2 + 2).map((item) => {
              const product = products.find((entry) => entry.id === item.productId);
              return (
                <button
                  key={item.id}
                  className="es-side"
                  type="button"
                  onClick={() => handleAddToBag(product)}
                >
                  <span>
                    <span className="es-side-tag">{item.tag}</span>
                    <span className="es-side-name">{item.name}</span>
                    <span className="es-side-price">{formatCurrency(item.price)}</span>
                  </span>
                  <span className="es-side-add">
                    Add to bag <span>→</span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="fbar">
        <div className="ftabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'bags', label: 'Bags' },
            { key: 'belts', label: 'Belts' },
            { key: 'scarves', label: 'Scarves' },
            { key: 'small', label: 'Small Leather' },
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
            <option value="low">Price: Low–High</option>
            <option value="high">Price: High–Low</option>
          </select>
        </div>
      </div>

      <section className="grid-sec" id="acc-grid">
        <div className="grid-hd">
          All Accessories <small>— Spring / Summer 2026</small>
        </div>
        <div className="pgrid">
          {visibleProducts.map((product, index) => {
            const shapeClass = index % 6 === 0 ? 'sq' : index % 5 === 0 ? 'tall' : '';
            return (
              <div key={product.id} className={`pc ${shapeClass}`}>
              <div className="pci">
                <div className={`pcbg ${product.bgClass}`} />
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
            );
          })}
        </div>
      </section>

      <section className="craft">
        {craftItems.map((item) => (
          <div key={item.id} className="craft-item">
            <div className="craft-icon">{item.icon}</div>
            <div>
              <div className="craft-title">{item.title}</div>
              <div className="craft-sub">{item.body}</div>
            </div>
          </div>
        ))}
      </section>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
