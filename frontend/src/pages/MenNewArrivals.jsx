import { useMemo, useRef, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import '../styles/men-new-arrivals.css';

const products = [
  {
    id: 'linen-tailored-blazer',
    name: 'Linen Tailored Blazer',
    category: 'outerwear',
    categoryLabel: 'Outerwear',
    price: 580,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'bdark',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultSize: 'M',
    swatches: ['#1A1A1A', '#C8BAB0', '#A8B8A0'],
    imageClass: 'linen',
  },
  {
    id: 'linen-oxford-shirt',
    name: 'Linen Oxford Shirt',
    category: 'shirts',
    categoryLabel: 'Shirts',
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
    id: 'twill-chino-trousers',
    name: 'Twill Chino Trousers',
    category: 'trousers',
    categoryLabel: 'Trousers',
    price: 290,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b4',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultSize: 'M',
    swatches: ['#C8BAB0', '#1A1A1A'],
    imageClass: 'denim',
  },
  {
    id: 'merino-crewneck',
    name: 'Merino Crewneck',
    category: 'knitwear',
    categoryLabel: 'Knitwear',
    price: 340,
    badge: 'pltd',
    badgeText: 'Limited',
    bgClass: 'b9',
    sizes: ['S', 'M', 'L'],
    defaultSize: 'M',
    swatches: ['#B8C2AA', '#C8BAB0', '#1A1A1A'],
    imageClass: 'wool',
  },
  {
    id: 'poplin-band-collar-shirt',
    name: 'Poplin Band Collar Shirt',
    category: 'shirts',
    categoryLabel: 'Shirts',
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
    id: 'linen-wide-trousers',
    name: 'Linen Wide Trousers',
    category: 'trousers',
    categoryLabel: 'Trousers',
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
    id: 'cotton-field-jacket',
    name: 'Cotton Field Jacket',
    category: 'outerwear',
    categoryLabel: 'Outerwear',
    price: 420,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b6',
    sizes: ['S', 'M', 'L', 'XL'],
    defaultSize: 'M',
    swatches: ['#C6AEA0', '#A8B8A0'],
    imageClass: 'cotton',
  },
  {
    id: 'cashmere-polo-knit',
    name: 'Cashmere Polo Knit',
    category: 'knitwear',
    categoryLabel: 'Knitwear',
    price: 295,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b8',
    sizes: ['S', 'M', 'L'],
    defaultSize: 'S',
    swatches: ['#B6B0C2', '#C8BAB0', '#1A1A1A'],
    imageClass: 'wool',
  },
];

const heroCards = [
  {
    id: 'hero-blazer',
    badge: 'Just In',
    name: 'Linen Tailored Blazer',
    price: 580,
    bgClass: 'bdark',
    span: 2,
  },
  {
    id: 'hero-shirt',
    badge: 'New',
    name: 'Oxford Linen Shirt',
    price: 210,
    bgClass: 'b5',
  },
  {
    id: 'hero-trousers',
    badge: 'New',
    name: 'Twill Chino',
    price: 290,
    bgClass: 'b4',
  },
];

const editorialPicks = [
  {
    id: 'edit-blazer',
    badge: 'Just In',
    badgeClass: 'ec-new',
    name: 'Linen Tailored Blazer',
    price: 580,
    bgClass: 'bdark',
    productId: 'linen-tailored-blazer',
  },
  {
    id: 'edit-shirt',
    badge: 'New',
    badgeClass: 'ec-new',
    name: 'Linen Oxford Shirt',
    price: 210,
    bgClass: 'b5',
    productId: 'linen-oxford-shirt',
  },
  {
    id: 'edit-knit',
    badge: 'Limited',
    badgeClass: 'ec-ltd',
    name: 'Merino Crewneck',
    price: 340,
    bgClass: 'b9',
    productId: 'merino-crewneck',
  },
];

const marqueeItems = [
  "SS26 Men's Collection",
  '12 new pieces',
  'Linen · Merino · Cotton · Cashmere',
  'Handcut in Paris',
  'Free alterations for life',
];

const stats = [
  { value: '12', label: 'New Pieces' },
  { value: '200', suffix: 'km', label: 'Sourcing Radius' },
  { value: '∞', label: 'Lifetime Repairs' },
  { value: 'SS26', label: 'Current Season' },
];

const formatCurrency = (value) => `LKR${value.toLocaleString()}`;

export default function MenNewArrivals() {
  const { addItem } = useCart();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('new');
  const [toast, setToast] = useState('');
  const [wishlist, setWishlist] = useState(() => new Set());
  const toastTimer = useRef(null);
  const [selectedSizes, setSelectedSizes] = useState(() =>
    products.reduce((acc, product) => {
      if (product.sizes?.length) {
        acc[product.id] = product.defaultSize || product.sizes[0];
      }
      return acc;
    }, {})
  );

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
  }, [filter, sort]);

  const pieceCount = visibleProducts.length;
  const marqueeLoop = [...marqueeItems, ...marqueeItems];

  return (
    <div className="men-new-arrivals">
      <section className="hero">
        <div className="hl">
          <div className="h-in">
            <div className="h-ey">Spring / Summer 2026</div>
            <h1 className="h-t">
              Men&apos;s
              <br />
              <em>New</em>
              <br />
              Arrivals
            </h1>
            <p className="h-desc">
              Twelve pieces for the considered man. Cut from European linen, Merino, and brushed cotton — each detail
              deliberate, each seam built to last.
            </p>
            <div className="h-btns">
              <a href="#arrivals" className="h-btn1">
                Shop All
              </a>
              <a href="/men" className="h-btn2">
                View Shirts
              </a>
            </div>
          </div>
        </div>
        <div className="hr">
          {heroCards.map((card) => (
            <div key={card.id} className={`hc ${card.span ? 'tall' : ''}`}>
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

      <div className="stats">
        {stats.map((stat) => (
          <div key={stat.label} className="stat">
            <div className="stat-n">
              {stat.value}
              {stat.suffix ? <span className="stat-suf">{stat.suffix}</span> : null}
            </div>
            <div className="stat-l">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="ed-sec" id="arrivals">
        <div className="sec-label">Editor&apos;s Picks — Men</div>
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
            { key: 'shirts', label: 'Shirts' },
            { key: 'trousers', label: 'Trousers' },
            { key: 'outerwear', label: 'Outerwear' },
            { key: 'knitwear', label: 'Knitwear' },
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

      <section className="grid-sec">
        <div className="grid-hd">
          All Men&apos;s Arrivals <small>— Spring / Summer 2026</small>
        </div>
        <div className="pgrid">
          {visibleProducts.map((product) => (
            <div key={product.id} className="pc">
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
                  {product.sizes?.length ? (
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
                  ) : null}
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
