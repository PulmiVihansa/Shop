import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import useProducts from '../hooks/useProducts.js';
import '../styles/dresses.css';

const heroTiles = [
  { id: 'hero-broderie', name: 'Broderie Anglaise Midi', bgClass: 'b6' },
  { id: 'hero-silk-wrap', name: 'Silk Wrap Maxi', bgClass: 'b2' },
];

const lookbook = [
  {
    id: 'look-01',
    name: 'Broderie Anglaise Midi',
    category: 'Midi',
    price: 395,
    badge: 'lkb-new',
    badgeText: 'New',
    bgClass: 'b6',
    productId: 'broderie-anglaise-midi',
  },
  {
    id: 'look-02',
    name: 'Silk Wrap Maxi',
    category: 'Maxi',
    price: 485,
    badge: 'lkb-new',
    badgeText: 'New',
    bgClass: 'b2',
    productId: 'silk-wrap-maxi',
  },
  {
    id: 'look-03',
    name: 'Cotton Prairie Dress',
    category: 'Midi',
    price: 290,
    badge: 'lkb-ltd',
    badgeText: 'Limited',
    bgClass: 'b9',
    productId: 'cotton-prairie-dress',
  },
  {
    id: 'look-04',
    name: 'Gauze Flutter Dress',
    category: 'Mini',
    price: 275,
    badge: 'lkb-new',
    badgeText: 'New',
    bgClass: 'b7',
    productId: 'gauze-flutter-dress',
  },
  {
    id: 'look-05',
    name: 'Velvet Column Gown',
    category: 'Evening',
    price: 595,
    badge: 'lkb-new',
    badgeText: 'New',
    bgClass: 'b8',
    productId: 'velvet-column-gown',
  },
  {
    id: 'look-06',
    name: 'Linen Shirt Dress',
    category: 'Midi',
    price: 310,
    badge: 'lkb-new',
    badgeText: 'New',
    bgClass: 'b1',
    productId: 'linen-shirt-dress',
  },
];

const fallbackProducts = [
  {
    id: 'broderie-anglaise-midi',
    name: 'Broderie Anglaise Midi',
    category: 'midi',
    categoryLabel: 'Midi',
    price: 395,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b6',
    sizes: ['XS', 'S', 'M', 'L'],
    defaultSize: 'S',
    swatches: ['#FAF7F2'],
    imageClass: 'cotton',
  },
  {
    id: 'silk-wrap-maxi',
    name: 'Silk Wrap Maxi',
    category: 'maxi',
    categoryLabel: 'Maxi',
    price: 485,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b2',
    sizes: ['XS', 'S', 'M'],
    defaultSize: 'XS',
    swatches: ['#A8B8A0', '#8f9390', '#1A1A1A'],
    imageClass: 'silk',
  },
  {
    id: 'linen-shirt-dress',
    name: 'Linen Shirt Dress',
    category: 'midi',
    categoryLabel: 'Midi',
    price: 310,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b1',
    sizes: ['XS', 'S', 'M', 'L'],
    defaultSize: 'M',
    swatches: ['#C8BAB0', '#FAF7F2'],
    imageClass: 'linen',
  },
  {
    id: 'gauze-flutter-dress',
    name: 'Gauze Flutter Dress',
    category: 'mini',
    categoryLabel: 'Mini',
    price: 275,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b7',
    sizes: ['XS', 'S', 'M'],
    defaultSize: 'S',
    swatches: ['#A6C0B2'],
    imageClass: 'cotton',
  },
  {
    id: 'velvet-column-gown',
    name: 'Velvet Column Gown',
    category: 'evening',
    categoryLabel: 'Evening',
    price: 595,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b8',
    sizes: ['XS', 'S', 'M', 'L'],
    defaultSize: 'S',
    swatches: ['#B6B0C2', '#1A1A1A'],
    imageClass: 'velvet',
  },
  {
    id: 'cotton-prairie-dress',
    name: 'Cotton Prairie Dress',
    category: 'midi',
    categoryLabel: 'Midi',
    price: 290,
    badge: 'pltd',
    badgeText: 'Limited',
    bgClass: 'b9',
    sizes: ['XS', 'S', 'M', 'L'],
    defaultSize: 'M',
    swatches: ['#B8C2AA', '#FAF7F2'],
    imageClass: 'cotton',
  },
  {
    id: 'silk-slip-dress',
    name: 'Silk Slip Dress',
    category: 'evening',
    categoryLabel: 'Evening',
    price: 420,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b3',
    sizes: ['XS', 'S', 'M'],
    defaultSize: 'XS',
    swatches: ['#B0A8B8', '#8f9390'],
    imageClass: 'silk',
  },
  {
    id: 'linen-halter-maxi',
    name: 'Linen Halter Maxi',
    category: 'maxi',
    categoryLabel: 'Maxi',
    price: 355,
    badge: 'pnew',
    badgeText: 'New',
    bgClass: 'b12',
    sizes: ['XS', 'S', 'M', 'L'],
    defaultSize: 'S',
    swatches: ['#C4B6A8', '#1A1A1A'],
    imageClass: 'linen',
  },
];

const marqueeItems = [
  'The Dress Edit \u2014 SS26',
  'Linen \u00B7 Silk \u00B7 Gauze \u00B7 Velvet',
  'Sourced within 200km of Paris',
  'Designed for movement',
  'Lifetime repair guarantee',
];

const filterLabels = {
  all: 'All Dresses',
  midi: 'Midi Dresses',
  maxi: 'Maxi Dresses',
  mini: 'Mini Dresses',
  evening: 'Evening Dresses',
};

const formatCurrency = (value) => `LKR${value.toLocaleString()}`;

export default function Women() {
  const { addItem } = useCart();
  const { products } = useProducts({ fallback: fallbackProducts });
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
    showToast(`Quick view \u2014 ${product.name}`);
  };

  const handleSizeSelect = (productId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const handleFilterChange = (nextFilter) => {
    setFilter(nextFilter);
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
  const gridTitle = filterLabels[filter] || filterLabels.all;

  return (
    <div className="dresses">
      <section className="ph">
        <div className="ph-inner">
          <div className="ph-l">
            <div className="ph-txt">
              <div className="ph-ey">Women&apos;s Collection \u2014 SS26</div>
              <h1 className="ph-h">
                The
                <br />
                Dress <em>Edit</em>
              </h1>
              <p className="ph-desc">
                From effortless day dresses in laundered linen to considered evening silhouettes in silk \u2014 each
                cut to move with you, not against you.
              </p>
              <div className="ph-cats">
                {[
                  { key: 'all', label: 'All Dresses' },
                  { key: 'midi', label: 'Midi' },
                  { key: 'maxi', label: 'Maxi' },
                  { key: 'mini', label: 'Mini' },
                  { key: 'evening', label: 'Evening' },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    className={`phcat ${filter === cat.key ? 'on' : ''}`}
                    onClick={() => handleFilterChange(cat.key)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="ph-r">
            {heroTiles.map((tile) => (
              <div key={tile.id} className="ph-rc">
                <div className={`ph-rcbg ${tile.bgClass}`} />
                <div className="ph-rc-inf">
                  <div className="ph-rc-n">{tile.name}</div>
                </div>
              </div>
            ))}
          </div>
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

      <div className="lkb">
        <div className="lkb-hd">
          <div className="lkb-t">The Lookbook</div>
          <div className="lkb-sub">Hover to shop</div>
        </div>
        <div className="lkb-grid">
          {lookbook.map((look, index) => {
            const product = products.find((entry) => entry.id === look.productId);
            return (
              <div key={look.id} className="lk">
                <div className="lk-img">
                  <div className={`lk-ibg ${look.bgClass}`} />
                  <div className="lk-ov" />
                </div>
                <span className={`lk-badge ${look.badge}`}>{look.badgeText}</span>
                <div className="lk-num">{String(index + 1).padStart(2, '0')}</div>
                <div className="lk-inf">
                  <div className="lk-n">{look.name}</div>
                  <div className="lk-n2">Women \u00B7 {look.category}</div>
                  <div className="lk-p">{formatCurrency(look.price)}</div>
                  <button className="lk-add" type="button" onClick={() => handleAddToBag(product)}>
                    Quick Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="fbar">
        <div className="ftabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'midi', label: 'Midi' },
            { key: 'maxi', label: 'Maxi' },
            { key: 'mini', label: 'Mini' },
            { key: 'evening', label: 'Evening' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`ft ${filter === tab.key ? 'on' : ''}`}
              onClick={() => handleFilterChange(tab.key)}
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
          {gridTitle} \u2014 {pieceCount} styles
        </div>
        <div className="pgrid">
          {visibleProducts.map((product) => (
            <div key={product.id} className="pc">
              <div className="pci">
                <div className={`pcbg ${product.bgClass}`} />
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
