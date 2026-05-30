import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import useProducts from '../hooks/useProducts.js';
import { createCartItem, getProductId, getProductSizes } from '../utils/cartProduct.js';
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
    labelClass: 'lkb-new',
    label: 'New',
    bgClass: 'b6',
    productId: 'broderie-anglaise-midi',
  },
  {
    id: 'look-02',
    name: 'Silk Wrap Maxi',
    category: 'Maxi',
    price: 485,
    labelClass: 'lkb-new',
    label: 'New',
    bgClass: 'b2',
    productId: 'silk-wrap-maxi',
  },
  {
    id: 'look-03',
    name: 'Cotton Prairie Dress',
    category: 'Midi',
    price: 290,
    labelClass: 'lkb-ltd',
    label: 'Limited',
    bgClass: 'b9',
    productId: 'cotton-prairie-dress',
  },
  {
    id: 'look-04',
    name: 'Gauze Flutter Dress',
    category: 'Mini',
    price: 275,
    labelClass: 'lkb-new',
    label: 'New',
    bgClass: 'b7',
    productId: 'gauze-flutter-dress',
  },
  {
    id: 'look-05',
    name: 'Velvet Column Gown',
    category: 'Evening',
    price: 595,
    labelClass: 'lkb-new',
    label: 'New',
    bgClass: 'b8',
    productId: 'velvet-column-gown',
  },
  {
    id: 'look-06',
    name: 'Linen Shirt Dress',
    category: 'Midi',
    price: 310,
    labelClass: 'lkb-new',
    label: 'New',
    bgClass: 'b1',
    productId: 'linen-shirt-dress',
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
  Midi: 'Midi Dresses',
  Maxi: 'Maxi Dresses',
  Mini: 'Mini Dresses',
  Evening: 'Evening Dresses',
};

const formatCurrency = (value) => `LKR${value.toLocaleString()}`;

export default function Women() {
  const { addItem } = useCart();
  const { products, loading, error } = useProducts({ collection: 'female', category: 'Dresses' });
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
    showToast(`Quick view \u2014 ${product.name}`);
  };

  const handleSizeSelect = (productId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const handleFilterChange = (nextFilter) => {
    setFilter(nextFilter);
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
                  { key: 'Midi', label: 'Midi' },
                  { key: 'Maxi', label: 'Maxi' },
                  { key: 'Mini', label: 'Mini' },
                  { key: 'Evening', label: 'Evening' },
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
                <span className={`lk-badge ${look.labelClass}`}>{look.label}</span>
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
            { key: 'Midi', label: 'Midi' },
            { key: 'Maxi', label: 'Maxi' },
            { key: 'Mini', label: 'Mini' },
            { key: 'Evening', label: 'Evening' },
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

      {loading && <div className="grid-sec"><div className="grid-hd">Loading dresses...</div></div>}
      {!loading && error && <div className="grid-sec"><div className="grid-hd">{error}</div></div>}
      {!loading && !error && visibleProducts.length === 0 && <div className="grid-sec"><div className="grid-hd">No dresses found.</div></div>}

      <section className="grid-sec">
        <div className="grid-hd">
          {gridTitle} \u2014 {pieceCount} styles
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
                <div className="pcat">{product.subcategory || product.categoryLabel}</div>
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

