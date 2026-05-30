import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import useProducts from '../hooks/useProducts.js';
import usePageContent, { lines } from '../hooks/usePageContent.js';
import '../styles/tops.css';

const heroCards = [
  { id: 'hero-silk', name: 'Silk Pliss\u00E9 Blouse', badge: 'New', bgClass: 'b3', span: 2 },
  { id: 'hero-linen', name: 'Linen Boxy Shirt', badge: 'New', bgClass: 'b5' },
  { id: 'hero-cashmere', name: 'Cashmere Roll-Neck', badge: 'New', bgClass: 'b9' },
];

const marqueeItems = [
  'Tops \u2014 SS26',
  'Silk \u00B7 Linen \u00B7 Cotton \u00B7 Cashmere',
  'Natural fibres only',
  'Sourced within 200km of Paris',
  'Lifetime repair guarantee',
];

const colorFilters = [
  { name: 'Ivory', value: '#FAF7F2', light: true },
  { name: 'Stone', value: '#C8BAB0' },
  { name: 'Pebble', value: '#D4CDC5' },
  { name: 'Sage', value: '#B8C2AA' },
  { name: 'Forest', value: '#A8B8A0' },
  { name: 'Lavender', value: '#B0A8B8' },
  { name: 'Ash', value: '#8f9390' },
  { name: 'Noir', value: '#1A1A1A' },
];

const materialCards = [
  { id: 'mat-silk', title: 'Silk', content: '100% Mulberry Silk, 16mm', origin: 'Sourced from Lyon, France' },
  { id: 'mat-linen', title: 'Linen', content: '100% Belgian Linen', origin: 'Sourced from Ghent, Belgium' },
  { id: 'mat-cotton', title: 'Cotton', content: '100% Organic Cotton', origin: 'Sourced from Catalonia, Spain' },
  { id: 'mat-cashmere', title: 'Cashmere', content: 'Grade A Cashmere, 2-ply', origin: 'Sourced from Piemonte, Italy' },
];

const fallbackProducts = [
  {
    id: 'silk-plisse-blouse',
    name: 'Silk Pliss\u00E9 Blouse',
    category: 'blouse',
    categoryLabel: 'Blouse',
    price: 285,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b3',
    sizes: ['XS', 'S', 'M'],
    defaultSize: 'XS',
    swatches: ['#FAF7F2', '#8f9390'],
    imageClass: 'silk',
  },
  {
    id: 'linen-boxy-shirt',
    name: 'Linen Boxy Shirt',
    category: 'shirt',
    categoryLabel: 'Shirt',
    price: 195,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b5',
    sizes: ['XS', 'S', 'M', 'L'],
    defaultSize: 'S',
    swatches: ['#B0B8C0', '#FAF7F2', '#C8BAB0'],
    imageClass: 'linen',
  },
  {
    id: 'cashmere-roll-neck',
    name: 'Cashmere Roll-Neck',
    category: 'knit',
    categoryLabel: 'Knit',
    price: 380,
    badge: 'pltd',
    badgeText: 'Limited',
    bgClass: 'b9',
    sizes: ['XS', 'S', 'M'],
    defaultSize: 'S',
    swatches: ['#B8C2AA', '#C8BAB0', '#1A1A1A'],
    imageClass: 'wool',
  },
  {
    id: 'cotton-smocked-top',
    name: 'Cotton Smocked Top',
    category: 'blouse',
    categoryLabel: 'Blouse',
    price: 165,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b7',
    sizes: ['XS', 'S', 'M', 'L'],
    defaultSize: 'M',
    swatches: ['#A6C0B2', '#FAF7F2'],
    imageClass: 'cotton',
  },
  {
    id: 'silk-camisole',
    name: 'Silk Camisole',
    category: 'vest',
    categoryLabel: 'Vest',
    price: 145,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b2',
    sizes: ['XS', 'S', 'M'],
    defaultSize: 'XS',
    swatches: ['#A8B8A0', '#B0A8B8', '#1A1A1A'],
    imageClass: 'silk',
  },
  {
    id: 'broderie-peasant-top',
    name: 'Broderie Peasant Top',
    category: 'blouse',
    categoryLabel: 'Blouse',
    price: 225,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b6',
    sizes: ['XS', 'S', 'M', 'L'],
    defaultSize: 'S',
    swatches: ['#FAF7F2'],
    imageClass: 'cotton',
  },
  {
    id: 'cotton-utility-shirt',
    name: 'Cotton Utility Shirt',
    category: 'shirt',
    categoryLabel: 'Shirt',
    price: 215,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b4',
    sizes: ['XS', 'S', 'M', 'L'],
    defaultSize: 'M',
    swatches: ['#C0B8A8', '#B0B8C0'],
    imageClass: 'cotton',
  },
  {
    id: 'knitted-silk-vest',
    name: 'Knitted Silk Vest',
    category: 'vest',
    categoryLabel: 'Vest',
    price: 195,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b12',
    sizes: ['XS', 'S', 'M'],
    defaultSize: 'S',
    swatches: ['#C4B6A8', '#1A1A1A'],
    imageClass: 'silk',
  },
];

const formatCurrency = (value) => `LKR${value.toLocaleString()}`;

export default function Tops() {
  const content = usePageContent('tops');
  const { addItem } = useCart();
  const { products } = useProducts({ fallback: fallbackProducts, placement: 'tops' });
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('new');
  const [toast, setToast] = useState('');
  const [wishlist, setWishlist] = useState(() => new Set());
  const [activeColor, setActiveColor] = useState(null);
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
    showToast(`Quick view \u2014 ${product.name}`);
  };

  const handleSizeSelect = (productId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const handleColorPick = (name) => {
    if (activeColor === name) {
      setActiveColor(null);
      showToast('All colours');
      return;
    }
    setActiveColor(name);
    showToast(`Filtering by: ${name}`);
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

  const pieceCount = visibleProducts.length;
  const marqueeLoop = [...marqueeItems, ...marqueeItems];

  return (
    <div className="tops">
      <section className="hero-tp">
        <div className="ht-l">
          <div className="ht-yr" aria-hidden="true">
            TOPS
          </div>
          <div className="ht-in">
            <div className="ht-ey">{content.eyebrow}</div>
            <h1 className="ht-h">
              {lines(content.title).map((line, index) => (
                index === lines(content.title).length - 1
                  ? <em key={line}>{line}</em>
                  : <span key={line}>{line}<br /></span>
              ))}
            </h1>
            <p className="ht-desc">{content.description}</p>
            <div className="ht-stats">
              <div>
                <span className="hs-v">8</span>
                <span className="hs-l">Styles</span>
              </div>
              <div>
                <span className="hs-v">4</span>
                <span className="hs-l">Fabrics</span>
              </div>
              <div>
                <span className="hs-v">100%</span>
                <span className="hs-l">Natural fibres</span>
              </div>
            </div>
          </div>
        </div>
        <div className="ht-r">
          {heroCards.map((card) => (
            <div key={card.id} className="htc" style={card.span ? { gridRow: `span ${card.span}` } : undefined}>
              <div className={`htcbg ${card.bgClass}`} />
              <span className="htcbadge">{card.badge}</span>
              <div className="htc-inf">
                <div className="htc-n">{card.name}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mbar" style={{ background: 'var(--crdk)' }} aria-hidden="true">
        <div className="mi">
          {marqueeLoop.map((item, index) => (
            <span key={`${item}-${index}`} className="mt" style={{ fontSize: '.82rem', color: 'var(--ink)' }}>
              {item}
              <span className="md" style={{ background: 'var(--stl)' }} />
            </span>
          ))}
        </div>
      </div>

      <div className="colour-row">
        <span className="cr-lbl">Shop by colour</span>
        <div className="cr-swatches">
          {colorFilters.map((color) => (
            <button
              key={color.name}
              type="button"
              className={`crsw ${color.light ? 'crsw-light' : ''} ${activeColor === color.name ? 'on' : ''}`}
              style={{ background: color.value }}
              title={color.name}
              onClick={() => handleColorPick(color.name)}
            />
          ))}
        </div>
        <span className="cr-name">{activeColor || 'All colours'}</span>
      </div>

      <div className="fbar">
        <div className="ftabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'blouse', label: 'Blouses' },
            { key: 'shirt', label: 'Shirts' },
            { key: 'knit', label: 'Knitwear' },
            { key: 'vest', label: 'Vests' },
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

      <div className="mat-sec">
        <div className="mat-hd">Every fibre, traced to source</div>
        <div className="mat-grid">
          {materialCards.map((card) => (
            <div key={card.id} className="mc">
              <div className="mc-mat">{card.title}</div>
              <div className="mc-cnt">{card.content}</div>
              <div className="mc-orig">{card.origin}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="grid-sec">
        <div className="grid-hd">All Tops \u2014 SS26</div>
        <div className="pgrid">
          {visibleProducts.map((product) => (
            <div key={product.id} className="pc">
              <div className="pci">
                <div className={`pcbg ${product.bgClass}`} />
                {product.images?.[0] && (
                  <img className="pcimg" src={product.images[0]} alt={product.name} loading="lazy" />
                )}
                {product.badgeText && (
                  <span className={`pbadge ${product.badge}`}>{product.badgeText}</span>
                )}
                <div className="pc-acts">
                  <button
                    type="button"
                    className={`pa ${wishlist.has(product.id) ? 'is-active' : ''}`}
                    aria-label="Save to wishlist"
                    onClick={(event) => toggleWishlist(event, product)}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="pa"
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
                    {product.sizes?.map((size) => (
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
