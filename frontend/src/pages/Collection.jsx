import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiGrid, FiHeart, FiMenu, FiSliders } from 'react-icons/fi';
import useCollectionProducts from '../hooks/useCollectionProducts.js';
import { resolveImageUrl } from '../utils/imageUrl.js';
import { getAvailableSizeOptions, getAvailableSizes } from '../utils/availableSizes.js';
import '../styles/collection.css';

const wishlistStorageKey = 'astravia_wishlist';
const SKELETON_CARD_COUNT = 8;
const formatAstraviaPrice = (value) => `Rs. ${Number(value || 0).toLocaleString()}.00`;
const productImage = (product) => resolveImageUrl(product.images?.[0]) || '/models/Tshirt22.png';
const productPath = (product) => `/products/${product.slug || product.id || product._id}`;
const productBadge = (product) => product.badges?.[0] || '';
const productId = (product) => product.id || product._id || product.slug;
const filterToken = (section, value) => `${section}:${value}`;
const filterValue = (token) => token.split(':').slice(1).join(':');

const toList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeFilterValue = (value) => String(value || '').trim().toLowerCase();
const uniqueSorted = (values) => {
  const unique = values.reduce((acc, value) => {
    const label = String(value || '').trim();
    const key = normalizeFilterValue(label);
    if (key && !acc.has(key)) acc.set(key, label);
    return acc;
  }, new Map());
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
};
const productColors = (product) => toList(product.colors || product.colours || product.swatches);
const productSizesInStock = (product) => getAvailableSizes(product).map((size) => size.toUpperCase());

const readWishlist = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(wishlistStorageKey) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const CollectionProductSkeleton = memo(function CollectionProductSkeleton() {
  return (
    <article className="collection-product-card collection-product-skeleton" aria-hidden="true">
      <div className="product-card-top">
        <span className="collection-skeleton-line skeleton-badge" />
        <span className="collection-skeleton-circle" />
      </div>
      <div className="collection-product-image">
        <span className="collection-skeleton-image" />
      </div>
      <div className="collection-product-info">
        <div>
          <span className="collection-skeleton-line skeleton-title" />
          <span className="collection-skeleton-line skeleton-price" />
        </div>
        <span className="collection-skeleton-circle skeleton-arrow" />
      </div>
    </article>
  );
});

const CollectionProductCard = memo(function CollectionProductCard({ product, isWishlisted, onWishlistToggle }) {
  return (
    <article className="collection-product-card">
      <div className="product-card-top">
        <span>{productBadge(product)}</span>
        <button
          type="button"
          className={isWishlisted ? 'is-active' : ''}
          aria-label={`Wishlist ${product.name}`}
          onClick={() => onWishlistToggle(product)}
        >
          <FiHeart aria-hidden="true" />
        </button>
      </div>
      <Link
        className="collection-product-image"
        to={productPath(product)}
        state={{ product }}
      >
        <img src={productImage(product)} alt={product.name} loading="lazy" decoding="async" />
      </Link>
      <div className="collection-product-info">
        <div>
          <h2>{product.name}</h2>
          <p>{formatAstraviaPrice(product.price)}</p>
        </div>
        <Link
          className="product-arrow-link"
          to={productPath(product)}
          state={{ product }}
          aria-label={`View ${product.name}`}
        >
          &rarr;
        </Link>
      </div>
    </article>
  );
});

export default function Collection() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { products, filters, loading, error } = useCollectionProducts();
  const [activeFilters, setActiveFilters] = useState([]);
  const [priceMax, setPriceMax] = useState(null);
  const [wishlist, setWishlist] = useState(() => new Set(readWishlist().map((item) => item.id)));
  const [wishlistMessage, setWishlistMessage] = useState('');

  const maxProductPrice = useMemo(() => (
    Math.ceil(Math.max(0, ...products.map((product) => Number(product.price || 0))))
  ), [products]);
  const effectivePriceMax = priceMax ?? maxProductPrice;

  const filterSections = useMemo(() => {
    const categories = filters.categories.length ? filters.categories : uniqueSorted(products.map((product) => product.category));
    const colors = filters.colors.length ? filters.colors : uniqueSorted(products.flatMap(productColors));
    const sizeOptions = getAvailableSizeOptions(products);
    return [
      ['Category', categories],
      ['Size', sizeOptions],
      ['Color', colors],
    ].filter(([, options]) => options.length);
  }, [filters, products]);

  useEffect(() => {
    const validTokens = new Set(
      filterSections.flatMap(([title, options]) => options.map((option) => filterToken(title, option)))
    );
    setActiveFilters((current) => current.filter((token) => validTokens.has(token)));
  }, [filterSections]);

  const visibleProducts = useMemo(() => {
    const filtersFor = (section) => activeFilters
      .filter((token) => token.startsWith(`${section}:`))
      .map(filterValue);
    const categoryFilters = filtersFor('Category');
    const sizeFilters = filtersFor('Size');
    const colorFilters = filtersFor('Color');
    return products.filter((product) => {
      const matchesCategory = !categoryFilters.length || categoryFilters.some((category) => (
        normalizeFilterValue(category) === normalizeFilterValue(product.category)
      ));
      const sizesInStock = productSizesInStock(product);
      const colors = productColors(product);
      const matchesSize = !sizeFilters.length || sizeFilters.some((size) => sizesInStock.includes(size));
      const matchesColor = !colorFilters.length || colorFilters.some((color) => (
        colors.some((productColor) => normalizeFilterValue(productColor) === normalizeFilterValue(color))
      ));
      const matchesPrice = Number(product.price || 0) <= effectivePriceMax;
      return matchesCategory && matchesSize && matchesColor && matchesPrice;
    });
  }, [activeFilters, effectivePriceMax, products]);

  const toggleFilter = (section, value) => {
    const token = filterToken(section, value);
    setActiveFilters((current) => current.includes(token) ? current.filter((item) => item !== token) : [...current, token]);
  };

  const toggleWishlist = useCallback((product) => {
    const saved = readWishlist();
    const id = productId(product);
    const exists = saved.some((item) => item.id === id);
    const next = exists
      ? saved.filter((item) => item.id !== id)
      : [
          ...saved,
          {
            id,
            name: product.name,
            label: product.name,
            price: product.price,
            image: productImage(product),
            category: product.category,
            selectedSize: getAvailableSizes(product)[0] || '',
            sizes: getAvailableSizes(product),
            saved: 'Saved just now',
          },
        ];
    localStorage.setItem(wishlistStorageKey, JSON.stringify(next));
    setWishlist(new Set(next.map((item) => item.id)));
    setWishlistMessage(exists ? `${product.name} removed from wishlist` : `${product.name} saved to wishlist`);
  }, []);

  const filterPanel = (
    <aside className="collection-filter-panel">
      <div className="filter-panel-heading">
        <FiSliders aria-hidden="true" />
        <span>Filters</span>
      </div>

      {filterSections.map(([title, options]) => (
        <div className="filter-block" key={title}>
          <h3>{title}</h3>
          <div className="filter-options">
            {options.map((option) => (
              <label className="filter-check" key={option}>
                <input
                  type="checkbox"
                  checked={activeFilters.includes(filterToken(title, option))}
                  onChange={() => toggleFilter(title, option)}
                />
                <span aria-hidden="true" />
                {option}
              </label>
            ))}
          </div>
        </div>
      ))}

      {maxProductPrice > 0 && (
        <div className="filter-block">
          <h3>Price</h3>
          <input
            className="price-range"
            type="range"
            min="0"
            max={maxProductPrice}
            step="1"
            value={effectivePriceMax}
            onChange={(event) => setPriceMax(Number(event.target.value))}
            aria-label="Maximum price"
          />
          <div className="price-row">
            <span>{formatAstraviaPrice(0)}</span>
            <span>{formatAstraviaPrice(effectivePriceMax)}</span>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <section className="collection-page">
      <div className="wishlisttop-banner">
        <img src="/models/wishlisttop.png" alt="Astravia collection banner" loading="lazy" decoding="async" />
      </div>

      <div className="collection-shell">
        <button className="mobile-filter-button" type="button" onClick={() => setDrawerOpen(true)}>
          <FiMenu aria-hidden="true" />
          Filters
        </button>

        <div className="collection-sidebar">{filterPanel}</div>

        <div className="collection-products-area">
          <div className="collection-sort-bar">
            <div>
              <span>Sort By:</span>
              <strong>Best Selling</strong>
            </div>
            <div className="grid-toggle-icons" aria-hidden="true">
              <FiGrid />
              <FiGrid />
            </div>
          </div>
          {wishlistMessage && (
            <div className="collection-toast" onAnimationEnd={() => setWishlistMessage('')}>
              {wishlistMessage}
            </div>
          )}
          {error && !products.length && <div className="collection-empty">{error}</div>}

          <div className="collection-product-grid">
            {loading && Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
              <CollectionProductSkeleton key={`collection-skeleton-${index}`} />
            ))}
            {!loading && visibleProducts.map((product) => (
              <CollectionProductCard
                key={productId(product)}
                product={product}
                isWishlisted={wishlist.has(productId(product))}
                onWishlistToggle={toggleWishlist}
              />
            ))}
          </div>
          {!loading && !error && !visibleProducts.length && (
            <div className="collection-empty">No products match those filters.</div>
          )}
        </div>
      </div>

      <div className={`filter-drawer ${drawerOpen ? 'is-open' : ''}`} aria-hidden={!drawerOpen}>
        <button className="filter-drawer-backdrop" type="button" aria-label="Close filters" onClick={() => setDrawerOpen(false)} />
        <div className="filter-drawer-panel">
          <button className="filter-drawer-close" type="button" onClick={() => setDrawerOpen(false)}>
            Close
          </button>
          {filterPanel}
        </div>
      </div>
    </section>
  );
}
