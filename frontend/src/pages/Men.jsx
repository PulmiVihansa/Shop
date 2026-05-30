import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import ProductVisual from '../components/ProductVisual.jsx';
import useProducts from '../hooks/useProducts.js';
import { createCartItem, getProductId, getProductSizes } from '../utils/cartProduct.js';
import '../styles/dresses.css';

const filterLabels = {
  all: 'All Menswear',
  Shirts: 'Shirts',
  Trousers: 'Trousers',
};

const formatCurrency = (value) => `LKR${Number(value || 0).toLocaleString()}`;

export default function Men() {
  const { addItem } = useCart();
  const { products, loading, error } = useProducts({ collection: 'male' });
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('new');
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const [selectedSizes, setSelectedSizes] = useState({});

  const showToast = (message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
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

  const openProduct = (productId) => {
    if (productId) navigate(`/products/${productId}`);
  };

  const visibleProducts = useMemo(() => {
    let list = [...products];
    if (filter !== 'all') {
      list = list.filter((product) => product.category === filter);
    }
    if (sort === 'low') list.sort((a, b) => a.price - b.price);
    if (sort === 'high') list.sort((a, b) => b.price - a.price);
    return list;
  }, [filter, products, sort]);

  return (
    <div className="dresses">
      <section className="ph">
        <div className="ph-inner">
          <div className="ph-l">
            <div className="ph-txt">
              <div className="ph-ey">Menswear Collection — SS26</div>
              <h1 className="ph-h">
                The
                <br />
                Tailored <em>Line</em>
              </h1>
              <p className="ph-desc">
                Clean shirting, relaxed tailoring, and quiet luxury staples shaped for a precise everyday wardrobe.
              </p>
              <div className="ph-cats">
                {[
                  { key: 'all', label: 'All Menswear' },
                  { key: 'Shirts', label: 'Shirts' },
                  { key: 'Trousers', label: 'Trousers' },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    className={`phcat ${filter === cat.key ? 'on' : ''}`}
                    onClick={() => setFilter(cat.key)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="ph-r">
            {products.slice(0, 2).map((tile) => (
              <div key={tile.id} className="ph-rc">
                <ProductVisual product={tile} className="ph-rcbg" />
                <div className="ph-rc-inf">
                  <div className="ph-rc-n">{tile.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="fbar">
        <div className="ftabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'Shirts', label: 'Shirts' },
            { key: 'Trousers', label: 'Trousers' },
          ].map((tab) => (
            <button key={tab.key} type="button" className={`ft ${filter === tab.key ? 'on' : ''}`} onClick={() => setFilter(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="fbar-r">
          <span className="fcount">{visibleProducts.length} pieces</span>
          <select className="fsort" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="new">Newest First</option>
            <option value="low">Price: Low–High</option>
            <option value="high">Price: High–Low</option>
          </select>
        </div>
      </div>

      {loading && <div className="grid-sec"><div className="grid-hd">Loading menswear...</div></div>}
      {!loading && error && <div className="grid-sec"><div className="grid-hd">{error}</div></div>}
      {!loading && !error && visibleProducts.length === 0 && <div className="grid-sec"><div className="grid-hd">No menswear found.</div></div>}

      <section className="grid-sec">
        <div className="grid-hd">
          Menswear Edit — {visibleProducts.length} styles
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
                <div className="pc-bar">
                  <div className="pc-szs">
                    {getProductSizes(product).map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={`sz ${selectedSizes[product.id] === size ? 'on' : ''}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedSizes((prev) => ({ ...prev, [product.id]: size }));
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
                <div className="pcat">{product.categoryLabel || product.category || 'Shirts'}</div>
                <div className="pname">{product.name}</div>
                <div className="pprice">{formatCurrency(product.price)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}

