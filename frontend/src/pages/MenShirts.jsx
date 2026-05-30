import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import useProducts from '../hooks/useProducts.js';
import usePageContent, { lines } from '../hooks/usePageContent.js';
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

const fallbackProducts = [
  {
    id: 'linen-oxford-shirt',
    name: 'Linen Oxford Shirt',
    category: 'linen',
    categoryLabel: 'Linen',
    price: 210,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b5',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultSize: 'M',
    swatches: ['#FAF7F2', '#AEB8C2', '#C8BAB0'],
    imageClass: 'linen',
  },
  {
    id: 'poplin-band-collar-shirt',
    name: 'Poplin Band Collar Shirt',
    category: 'poplin',
    categoryLabel: 'Poplin',
    price: 185,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b7',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultSize: 'S',
    swatches: ['#FAF7F2', '#A6C0B2'],
    imageClass: 'cotton',
  },
  {
    id: 'chambray-overshirt',
    name: 'Chambray Overshirt',
    category: 'chambray',
    categoryLabel: 'Chambray',
    price: 240,
    badge: 'pltd',
    badgeText: 'Limited',
    bgClass: 'bdark',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultSize: 'M',
    swatches: ['#1A1A1A', '#AEB8C2'],
    imageClass: 'denim',
  },
  {
    id: 'oxford-button-down',
    name: 'Oxford Button-Down Shirt',
    category: 'oxford',
    categoryLabel: 'Oxford',
    price: 195,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b1',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultSize: 'M',
    swatches: ['#FAF7F2', '#C8BAB0', '#B0A8B8'],
    imageClass: 'linen',
  },
  {
    id: 'linen-camp-collar',
    name: 'Linen Camp Collar Shirt',
    category: 'linen',
    categoryLabel: 'Linen',
    price: 225,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b2',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultSize: 'S',
    swatches: ['#A8B8A0', '#C8BAB0'],
    imageClass: 'linen',
  },
  {
    id: 'poplin-relaxed-shirt',
    name: 'Poplin Relaxed Shirt',
    category: 'poplin',
    categoryLabel: 'Poplin',
    price: 175,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b4',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultSize: 'L',
    swatches: ['#FAF7F2', '#C6AEA0', '#1A1A1A'],
    imageClass: 'cotton',
  },
];

const storyFeatures = [
  { value: '12', label: 'Shirt Styles' },
  { value: '4', label: 'Fabrics' },
  { value: 'MOP', label: 'Pearl Buttons' },
];

const formatCurrency = (value) => `LKR${value.toLocaleString()}`;

export default function MenShirts() {
  const content = usePageContent('menShirts');
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
            { key: 'linen', label: 'Linen' },
            { key: 'poplin', label: 'Poplin' },
            { key: 'chambray', label: 'Chambray' },
            { key: 'oxford', label: 'Oxford' },
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
          <div className="size-cta-title">{content.sizeCtaTitle}</div>
          <div className="size-cta-sub">
            Our tailors recommend measuring chest, collar, and sleeve for the perfect shirt.
          </div>
        </div>
        <button className="size-cta-btn" type="button" onClick={() => showToast('Size guide opened')}>
          View Size Guide
        </button>
      </div>

      <section className="grid-sec">
        <div className="grid-hd">
          Men&apos;s Shirts <small>— Spring / Summer 2026</small>
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
