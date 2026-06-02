import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiClock, FiHeart, FiPackage, FiShield, FiShoppingBag, FiTruck, FiZap } from 'react-icons/fi';
import { useCart } from '../context/CartContext.jsx';
import { astraviaProducts, formatAstraviaPrice } from '../data/astraviaProducts.js';
import '../styles/sales.css';

const saleProducts = astraviaProducts.map((product, index) => {
  const discounts = [35, 45, 30, 25, 40, 50, 20, 38, 42, 28];
  const discount = discounts[index % discounts.length];
  const salePrice = Math.round((product.price * (100 - discount)) / 100 / 10) * 10;
  return {
    ...product,
    discount,
    salePrice,
    sizes: ['S', 'M', 'L', 'XL'],
  };
});

const filters = ['All', 'Under 3K', 'Final Drop', 'Black Tees', 'Cream Tees'];

export default function Sales() {
  const { addItem, openCart } = useCart();
  const [activeFilter, setActiveFilter] = useState('All');
  const [wishlist, setWishlist] = useState(() => new Set());
  const [selectedSizes, setSelectedSizes] = useState({});
  const [toast, setToast] = useState('');

  const visibleProducts = useMemo(() => {
    if (activeFilter === 'Under 3K') return saleProducts.filter((item) => item.salePrice < 3000);
    if (activeFilter === 'Final Drop') return saleProducts.filter((item) => item.discount >= 40);
    if (activeFilter === 'Black Tees') return saleProducts.filter((item) => item.color === 'Black');
    if (activeFilter === 'Cream Tees') return saleProducts.filter((item) => item.color === 'Cream');
    return saleProducts;
  }, [activeFilter]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  const toggleWishlist = (product) => {
    setWishlist((current) => {
      const next = new Set(current);
      if (next.has(product.id)) {
        next.delete(product.id);
        showToast(`${product.name} removed from wishlist`);
      } else {
        next.add(product.id);
        showToast(`${product.name} saved to wishlist`);
      }
      return next;
    });
  };

  const addSaleItem = (product) => {
    const size = selectedSizes[product.id] || 'M';
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.salePrice,
      size,
      quantity: 1,
    });
    openCart();
    showToast(`${product.name} added to cart`);
  };

  return (
    <section className="astravia-sales-page">
      <div className="sales-hero">
        <div className="sales-hero-copy">
          <p className="sales-kicker">Astravia Sale</p>
          <h1>FINAL<br /><span>REDUCTIONS.</span></h1>
          <p>
            Limited Astravia pieces at rare prices. Same heavyweight quality, same oversized streetwear fit, limited stock.
          </p>
          <div className="sales-hero-actions">
            <a href="#sale-products">Shop Sale</a>
            <Link to="/collection">View Collection</Link>
          </div>
        </div>

        <div className="sales-feature-card">
          <div className="sales-feature-badge">Up to 50% Off</div>
          <img src="/models/Tshirt44.png" alt="Astravia sale feature tee" />
          <div className="sales-feature-foot">
            <span>Limited stock</span>
            <strong>Ends Soon</strong>
          </div>
        </div>
      </div>

      <div className="sale-countdown-strip" aria-label="Sale benefits">
        {[
          ['48H', 'Flash Window', FiClock],
          ['50%', 'Max Discount', FiZap],
          ['Free', 'Island Delivery', FiTruck],
          ['Secure', 'Checkout', FiShield],
        ].map(([value, label, Icon]) => (
          <div key={label}>
            <Icon aria-hidden="true" />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="sales-toolbar" id="sale-products">
        <div>
          <p className="sales-kicker">Sale Room</p>
          <h2>Discounted Drops</h2>
        </div>
        <div className="sales-filter-row">
          {filters.map((filter) => (
            <button
              type="button"
              className={activeFilter === filter ? 'active' : ''}
              key={filter}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {toast && <div className="sales-toast">{toast}</div>}

      <div className="sales-product-grid">
        {visibleProducts.map((product) => (
          <article className="sale-product-card" key={product.id}>
            <div className="sale-card-top">
              <span>-{product.discount}%</span>
              <button
                type="button"
                className={wishlist.has(product.id) ? 'active' : ''}
                aria-label={`Save ${product.name}`}
                onClick={() => toggleWishlist(product)}
              >
                <FiHeart aria-hidden="true" />
              </button>
            </div>

            <Link className="sale-card-image" to={`/products/${product.id}`}>
              <img src={product.image} alt={product.name} />
            </Link>

            <div className="sale-card-info">
              <p>{product.category}</p>
              <h3>{product.name}</h3>
              <div className="sale-price-row">
                <strong>{formatAstraviaPrice(product.salePrice)}</strong>
                <span>{formatAstraviaPrice(product.price)}</span>
              </div>
            </div>

            <div className="sale-size-row">
              {product.sizes.map((size) => (
                <button
                  type="button"
                  className={(selectedSizes[product.id] || 'M') === size ? 'selected' : ''}
                  key={size}
                  onClick={() => setSelectedSizes((current) => ({ ...current, [product.id]: size }))}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="sale-card-actions">
              <button type="button" onClick={() => addSaleItem(product)}>
                <FiShoppingBag aria-hidden="true" />
                Add
              </button>
              <Link to={`/products/${product.id}`}>
                View <FiArrowRight aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="sales-promise-row">
        {[
          ['Fast Dispatch', 'Orders leave our Colombo studio within 24 hours.', FiPackage],
          ['Premium Quality', 'Sale pieces keep the same Astravia construction.', FiShield],
          ['Easy Support', 'Need help with sizing? Contact us before checkout.', FiTruck],
        ].map(([title, text, Icon]) => (
          <article key={title}>
            <Icon aria-hidden="true" />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
