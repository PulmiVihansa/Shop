import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiHeart, FiLock, FiRefreshCw, FiShield, FiTruck } from 'react-icons/fi';
import { useCart } from '../context/CartContext.jsx';
import api from '../services/api.js';
import { getStockStatus } from '../utils/stockStatus.js';
import '../styles/collection.css';

const wishlistStorageKey = 'astravia_wishlist';
const formatAstraviaPrice = (value) => `Rs. ${Number(value || 0).toLocaleString()}.00`;

const readWishlist = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(wishlistStorageKey) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const normalizeProductId = (product) => product?.id || product?._id || '';
const productPath = (product) => `/products/${product?.slug || normalizeProductId(product)}`;
const productImages = (product) => (Array.isArray(product?.images) ? product.images.filter(Boolean) : []);
const productMatchesRoute = (product, routeId) => {
  if (!product || !routeId) return false;
  return [product.slug, product.id, product._id]
    .filter(Boolean)
    .some((value) => String(value) === String(routeId));
};
const needsProductRefresh = (product) => (
  !product ||
  !Array.isArray(product.images) ||
  product.stock === undefined ||
  product.description === undefined ||
  (!Array.isArray(product.sizes) && !product.sizeStock)
);
const availableSizes = (product) => {
  const stock = product?.sizeStock && typeof product.sizeStock === 'object' ? product.sizeStock : {};
  const fromStock = Object.entries(stock)
    .filter(([, quantity]) => Number(quantity || 0) > 0)
    .map(([size]) => size);
  return fromStock.length ? fromStock : (product?.sizes || []).filter(Boolean);
};

const colorValue = (color) => {
  const value = String(color || '').trim();
  if (/^#([0-9a-f]{3}){1,2}$/i.test(value)) return value;
  const map = {
    black: '#050505',
    noir: '#050505',
    ivory: '#f5f1e8',
    cream: '#f5f1e8',
    pearl: '#f2eee5',
    grey: '#727176',
    gray: '#727176',
    charcoal: '#343434',
    sand: '#cbb996',
    natural: '#c69c6d',
    sage: '#9aaa85',
    mist: '#cad0cc',
    red: '#9b111e',
    white: '#ffffff',
  };
  return map[value.toLowerCase()] || '#8f7448';
};

export default function ProductDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addItem, openCart } = useCart();
  const routeProduct = productMatchesRoute(location.state?.product, id) ? location.state.product : null;
  const [loadedProduct, setLoadedProduct] = useState(() => routeProduct);
  const [allProducts, setAllProducts] = useState(() => (routeProduct ? [routeProduct] : []));
  const [loadingProduct, setLoadingProduct] = useState(!routeProduct);
  const [notFound, setNotFound] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeThumb, setActiveThumb] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [activeTab, setActiveTab] = useState('Description');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const product = productMatchesRoute(loadedProduct, id) ? loadedProduct : routeProduct;

  useEffect(() => {
    let active = true;

    if (routeProduct) {
      setLoadedProduct(routeProduct);
      setAllProducts((current) => (current.length ? current : [routeProduct]));
      setLoadingProduct(false);
      setNotFound(false);
    }

    const shouldFetchProduct = needsProductRefresh(routeProduct);
    const shouldFetchProducts = allProducts.length < 2;
    if (!shouldFetchProduct && !shouldFetchProducts) {
      return () => {
        active = false;
      };
    }

    async function loadProductData() {
      setNotFound(false);
      setLoadingProduct(shouldFetchProduct && !routeProduct);
      try {
        const [productRes, productsRes] = await Promise.all([
          shouldFetchProduct ? api.get(`/products/${id}`) : Promise.resolve(null),
          shouldFetchProducts ? api.get('/products') : Promise.resolve(null),
        ]);
        if (!active) return;
        if (productRes?.data) setLoadedProduct(productRes.data);
        if (productsRes?.data) {
          const rows = Array.isArray(productsRes.data) ? productsRes.data : [];
          setAllProducts(rows);
          if (!productRes?.data && routeProduct) {
            const matchingProduct = rows.find((item) => productMatchesRoute(item, id));
            if (matchingProduct && needsProductRefresh(routeProduct)) setLoadedProduct(matchingProduct);
          }
        }
      } catch {
        if (active && shouldFetchProduct && !routeProduct) {
          setLoadedProduct(null);
          setNotFound(true);
        }
      } finally {
        if (active) setLoadingProduct(false);
      }
    }
    loadProductData();
    return () => {
      active = false;
    };
  }, [allProducts.length, id, routeProduct]);

  useEffect(() => {
    if (!product) return;
    const nextSizes = availableSizes(product);
    const nextColors = product.colors || [];
    const nextImages = productImages(product);
    setSelectedSize((current) => (current && nextSizes.includes(current) ? current : nextSizes[0] || ''));
    setSelectedColor((current) => (current && nextColors.includes(current) ? current : nextColors[0] || ''));
    setActiveThumb((current) => (nextImages[current] ? current : 0));
    setIsWishlisted(readWishlist().some((item) => item.id === normalizeProductId(product)));
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const title = product.metaTitle || product.name;
    const description = product.metaDescription || product.description || '';
    const keywords = (product.metaKeywords || []).join(', ');
    document.title = title ? `${title} | Astravia` : 'Astravia Product';
    const upsertMeta = (name, content) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };
    upsertMeta('description', description);
    upsertMeta('keywords', keywords);
  }, [product]);

  const images = useMemo(() => productImages(product), [product]);
  const activeImage = images[activeThumb] || '';
  const primaryImage = images[0] || '';
  const sizes = useMemo(() => availableSizes(product), [product]);
  const currentStock = getStockStatus(product);
  const reviews = Array.isArray(product?.reviews) ? product.reviews : [];
  const rating = Number(product?.rating || 0);
  const reviewCount = Number(product?.reviewCount || reviews.length || 0);

  useEffect(() => {
    if (!primaryImage) return undefined;
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'image';
    preload.href = primaryImage;
    preload.setAttribute('fetchpriority', 'high');
    document.head.appendChild(preload);
    return () => {
      preload.remove();
    };
  }, [primaryImage]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const currentId = normalizeProductId(product);
    return allProducts
      .filter((item) => normalizeProductId(item) !== currentId)
      .filter((item) => (
        item.collection === product.collection ||
        item.category === product.category ||
        (item.badges || []).some((badge) => String(badge).toLowerCase().includes('best seller'))
      ))
      .slice(0, 4);
  }, [allProducts, product]);

  const detailRows = [
    ['Material', product?.material],
    ['Fabric', product?.fabric],
    ['Fit', product?.fit],
    ['Care Instructions', product?.careInstructions],
    ['Country of Origin', product?.countryOfOrigin],
    ['Collection', product?.collection],
  ].filter(([, value]) => value);

  const handleAddToCart = () => {
    if (!product || currentStock.className === 'out') return;
    addItem({
      productId: normalizeProductId(product),
      name: product.name,
      image: activeImage,
      price: product.price,
      color: selectedColor,
      size: selectedSize,
      quantity,
    });
    openCart();
  };

  const handleBuyNow = () => {
    if (!product || currentStock.className === 'out') return;
    const item = {
      productId: normalizeProductId(product),
      name: product.name,
      image: activeImage,
      price: product.price,
      color: selectedColor,
      size: selectedSize,
      quantity,
    };
    const subtotal = Number(product.price || 0) * quantity;
    const shipping = 250;
    const discount = 0;
    navigate('/checkout', {
      state: {
        items: [item],
        subtotal,
        shipping,
        discount,
        total: subtotal + shipping - discount,
        buyNow: true,
      },
    });
  };

  const handleWishlist = () => {
    if (!product) return;
    const productId = normalizeProductId(product);
    const saved = readWishlist();
    const exists = saved.some((item) => item.id === productId);
    const next = exists
      ? saved.filter((item) => item.id !== productId)
      : [
          ...saved,
          {
            id: productId,
            name: product.name,
            label: product.name,
            price: product.price,
            image: activeImage,
            category: product.category,
            selectedSize,
            sizes,
            saved: 'Saved just now',
          },
        ];

    localStorage.setItem(wishlistStorageKey, JSON.stringify(next));
    setIsWishlisted(!exists);
  };

  if (!product && notFound && !loadingProduct) {
    return (
      <section className="product-detail-page">
        <div className="product-detail-shell">
          <div className="collection-empty">Product not found.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="product-detail-page">
      <div className="product-detail-shell">
        <div className="product-breadcrumb">
          <Link to="/collection">Collection</Link>
          <span>/</span>
          <strong>{product?.name || <span className="product-detail-skeleton text crumb" aria-hidden="true" />}</strong>
        </div>

        <div className="product-detail-layout">
          <div className="product-thumbnails" aria-label="Product thumbnails">
            {images.map((image, index) => (
              <button
                type="button"
                className={index === activeThumb ? 'active' : ''}
                key={`${image}-${index}`}
                onClick={() => setActiveThumb(index)}
              >
                <img src={image} alt={`${product?.name || 'Product'} ${index + 1}`} loading="lazy" decoding="async" />
              </button>
            ))}
            {!images.length && [0, 1, 2].map((item) => (
              <button type="button" className="product-thumb-skeleton" key={item} aria-label="Product image loading" />
            ))}
          </div>

          <div className="product-main-panel">
            {activeImage ? (
              <img src={activeImage} alt={product?.name || 'Product'} loading="eager" decoding="async" fetchPriority="high" />
            ) : (
              <div className="product-detail-skeleton product-image-skeleton" aria-hidden="true" />
            )}
            <span aria-hidden="true" />
          </div>

          <aside className="product-info-panel">
            <div className="product-badge-row">
              {(product?.badges || []).map((badge) => <div className="limited-badge" key={badge}>{badge}</div>)}
            </div>
            <h1>{product?.name || <span className="product-detail-skeleton text title" aria-hidden="true" />}</h1>
            {product ? (
              <div className="product-rating">
              <span>{'★'.repeat(Math.round(rating))}{'☆'.repeat(Math.max(0, 5 - Math.round(rating)))}</span>
              <small>{reviewCount} Reviews</small>
              </div>
            ) : (
              <div className="product-copy-skeleton compact" aria-hidden="true">
                <span className="product-detail-skeleton text short" />
              </div>
            )}
            <div className="detail-price">{product ? formatAstraviaPrice(product.price) : <span className="product-detail-skeleton text price" aria-hidden="true" />}</div>
            {product ? (
              <div className={`product-stock-status ${currentStock.className}`}>{currentStock.detailLabel}</div>
            ) : (
              <span className="product-detail-skeleton text stock" aria-hidden="true" />
            )}
            {product?.description ? (
              <p>{product.description}</p>
            ) : (
              <div className="product-copy-skeleton" aria-hidden="true">
                <span className="product-detail-skeleton text" />
                <span className="product-detail-skeleton text short" />
              </div>
            )}
            {!!(product?.colors || []).length && (
              <div className="detail-option">
                <h2>Color</h2>
                <div className="detail-swatches">
                  {(product.colors || []).map((color) => (
                    <button
                      type="button"
                      className={selectedColor === color ? 'active' : ''}
                      style={{ background: colorValue(color) }}
                      key={color}
                      aria-label={`Select ${color}`}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
              </div>
            )}
            {!product && <div className="detail-option-skeleton product-detail-skeleton" aria-hidden="true" />}

            {!!sizes.length && (
              <div className="detail-option">
                <h2>Size</h2>
                <div className="detail-sizes">
                  {sizes.map((size) => (
                    <button
                      type="button"
                      className={selectedSize === size ? 'active' : ''}
                      key={size}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!product && <div className="detail-option-skeleton product-detail-skeleton" aria-hidden="true" />}

            <div className="detail-option">
              <h2>Quantity</h2>
              <div className="detail-quantity">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">-</button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity((value) => Math.min(10, value + 1))} aria-label="Increase quantity">+</button>
              </div>
            </div>

            <button className="detail-add-cart" type="button" onClick={handleAddToCart} disabled={!product || currentStock.className === 'out'}>Add To Cart</button>
            <button className="detail-buy-now" type="button" onClick={handleBuyNow} disabled={!product || currentStock.className === 'out'}>Buy It Now</button>
            <button className={`detail-wishlist ${isWishlisted ? 'is-active' : ''}`} type="button" onClick={handleWishlist}>
              <FiHeart aria-hidden="true" />
              {isWishlisted ? 'Saved To Wishlist' : 'Add To Wishlist'}
            </button>
          </aside>
        </div>

        <div className="detail-trust-bar">
          {[
            ['Worldwide Shipping', FiTruck],
            ['Easy Returns', FiRefreshCw],
            ['Secure Payment', FiLock],
          ].map(([label, Icon]) => (
            <div key={label}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <section className="product-detail-tabs">
          <div className="product-tab-list" role="tablist">
            {['Description', 'Details', 'Shipping', 'Size Guide'].map((tab) => (
              <button type="button" className={activeTab === tab ? 'active' : ''} key={tab} onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </div>
          <div className="product-tab-panel">
            {activeTab === 'Description' && (
              product ? (
                <p>{product.description || 'No product description has been added yet.'}</p>
              ) : (
                <div className="product-copy-skeleton" aria-hidden="true">
                  <span className="product-detail-skeleton text" />
                  <span className="product-detail-skeleton text short" />
                </div>
              )
            )}
            {activeTab === 'Details' && (
              detailRows.length ? (
                <dl>
                  {detailRows.map(([label, value]) => (
                    <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                  ))}
                </dl>
              ) : <p>No additional product details have been added yet.</p>
            )}
            {activeTab === 'Shipping' && <p>Shipping details are calculated during checkout based on destination and available delivery options.</p>}
            {activeTab === 'Size Guide' && <p>Available sizes are shown above based on current inventory for this product.</p>}
          </div>
        </section>

        {!!reviews.length && (
          <section className="product-reviews">
            <h2>Reviews</h2>
            {reviews.map((review, index) => (
              <article key={`${review.name || 'review'}-${index}`}>
                <strong>{review.name || 'Customer'}</strong>
                <span>{'★'.repeat(Math.round(Number(review.rating || 0)))}</span>
                <p>{review.comment || review.message || ''}</p>
              </article>
            ))}
          </section>
        )}

        <div className="product-story-grid">
          {detailRows.slice(0, 3).map(([title, text]) => (
            <article key={title}>
              <FiShield aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>

        {!!relatedProducts.length && (
          <section className="related-products">
            <div className="product-breadcrumb">
              <strong>Related Products</strong>
            </div>
            <div className="collection-product-grid">
              {relatedProducts.map((item) => (
                <article className="collection-product-card" key={normalizeProductId(item)}>
                  <div className="product-card-top">
                    <span>{item.badges?.[0] || ''}</span>
                  </div>
                  <Link className="collection-product-image" to={productPath(item)} state={{ product: item }}>
                    {productImages(item)[0] ? <img src={productImages(item)[0]} alt={item.name} loading="lazy" decoding="async" /> : <div className="product-image-empty">No image</div>}
                  </Link>
                  <div className="collection-product-info">
                    <div>
                      <h2>{item.name}</h2>
                      <p>{formatAstraviaPrice(item.price)}</p>
                    </div>
                    <Link className="product-arrow-link" to={productPath(item)} state={{ product: item }} aria-label={`View ${item.name}`}>
                      &rarr;
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
