import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { FiArrowRight, FiClock, FiHeart, FiPackage, FiShield, FiShoppingBag, FiTruck, FiZap } from 'react-icons/fi';
import { useCart } from '../context/CartContext.jsx';
import { salesProductsQuery } from '../services/salesQueries.js';
import '../styles/sales.css';

const filters = ['All', 'Under 3K', 'Final Drop', 'Black Tees', 'Cream Tees'];
const formatAstraviaPrice = (value) => `Rs. ${Number(value || 0).toLocaleString()}.00`;

const SaleProductCard = memo(function SaleProductCard({
  product,
  index,
  isWishlisted,
  selectedSize,
  onWishlistToggle,
  onSizeSelect,
  onAdd,
}) {
  const eagerImage = index < 8;

  return (
    <article className="sale-product-card">
      <div className="sale-card-top">
        <span>{product.discount}% OFF</span>
        <button
          type="button"
          className={isWishlisted ? 'active' : ''}
          aria-label={`Save ${product.name}`}
          onClick={() => onWishlistToggle(product)}
        >
          <FiHeart aria-hidden="true" />
        </button>
      </div>

      <Link className="sale-card-image" to={`/products/${product.id}`}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading={eagerImage ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={eagerImage ? 'high' : 'auto'}
          />
        ) : <span>No image</span>}
      </Link>

      <div className="sale-card-info">
        <p>{product.badge} / {product.category}</p>
        <h3>{product.name}</h3>
        <div className="sale-price-row">
          <strong>{formatAstraviaPrice(product.salePrice)}</strong>
          <span>{formatAstraviaPrice(product.price)}</span>
        </div>
      </div>

      <div className="sale-size-row">
        {(product.sizes.length ? product.sizes : ['S', 'M', 'L', 'XL']).map((size) => (
          <button
            type="button"
            className={selectedSize === size ? 'selected' : ''}
            key={size}
            onClick={() => onSizeSelect(product.id, size)}
          >
            {size}
          </button>
        ))}
      </div>

      <div className="sale-card-actions">
        <button type="button" onClick={() => onAdd(product)}>
          <FiShoppingBag aria-hidden="true" />
          Add
        </button>
        <Link to={`/products/${product.id}`}>
          View <FiArrowRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
});

export default function Sales() {
  const { addItem, openCart } = useCart();
  const [activeFilter, setActiveFilter] = useState('All');
  const [wishlist, setWishlist] = useState(() => new Set());
  const [selectedSizes, setSelectedSizes] = useState({});
  const [toast, setToast] = useState('');
  const salesQuery = useQuery({
    ...salesProductsQuery,
    placeholderData: keepPreviousData,
  });
  const saleProducts = salesQuery.data || [];
  const loading = salesQuery.isLoading && !saleProducts.length;

  const visibleProducts = useMemo(() => {
    if (activeFilter === 'Under 3K') return saleProducts.filter((item) => item.salePrice < 3000);
    if (activeFilter === 'Final Drop') return saleProducts.filter((item) => item.discount >= 40);
    if (activeFilter === 'Black Tees') return saleProducts.filter((item) => item.colors.some((color) => String(color).toLowerCase().includes('black')));
    if (activeFilter === 'Cream Tees') return saleProducts.filter((item) => item.colors.some((color) => String(color).toLowerCase().includes('cream')));
    return saleProducts;
  }, [activeFilter, saleProducts]);

  const heroProduct = saleProducts[0] || null;

  useEffect(() => {
    const images = Array.from(new Set(saleProducts.slice(0, 8).map((product) => product.image).filter(Boolean)));
    images.forEach((image) => {
      const alreadyPreloaded = Array
        .from(document.querySelectorAll('link[data-astravia-sale-preload="true"]'))
        .some((link) => link.getAttribute('href') === image);
      if (alreadyPreloaded) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = image;
      link.setAttribute('data-astravia-sale-preload', 'true');
      document.head.appendChild(link);
    });

    return () => {
      document
        .querySelectorAll('link[data-astravia-sale-preload="true"]')
        .forEach((link) => link.remove());
    };
  }, [saleProducts]);

  const showToast = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  }, []);

  const toggleWishlist = useCallback((product) => {
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
  }, [showToast]);

  const addSaleItem = useCallback((product) => {
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
  }, [addItem, openCart, selectedSizes, showToast]);

  const selectSize = useCallback((productId, size) => {
    setSelectedSizes((current) => ({ ...current, [productId]: size }));
  }, []);

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
          <div className="sales-feature-badge">{heroProduct ? `${heroProduct.discount}% Off` : 'Sale'}</div>
          {heroProduct?.image && <img src={heroProduct.image} alt={heroProduct.name} loading="eager" decoding="async" fetchPriority="high" />}
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

      <div className="sales-product-grid" aria-busy={salesQuery.isFetching && !loading}>
        {loading && Array.from({ length: 8 }).map((_, index) => (
          <article className="sale-product-card sale-product-skeleton" key={`sale-skeleton-${index}`} aria-hidden="true" />
        ))}
        {!loading && visibleProducts.length === 0 && (
          <article className="sale-product-card sale-empty-card">
            <div className="sale-card-info">
              <p>Astravia Sale</p>
              <h3>No active sale campaigns</h3>
              <div className="sale-price-row"><strong>Check back soon</strong></div>
            </div>
          </article>
        )}
        {!loading && visibleProducts.map((product, index) => (
          <SaleProductCard
            key={product.campaignId || product.id}
            product={product}
            index={index}
            isWishlisted={wishlist.has(product.id)}
            selectedSize={selectedSizes[product.id] || 'M'}
            onWishlistToggle={toggleWishlist}
            onSizeSelect={selectSize}
            onAdd={addSaleItem}
          />
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
