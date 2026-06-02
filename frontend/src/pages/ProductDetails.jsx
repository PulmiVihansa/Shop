import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiHeart, FiLock, FiRefreshCw, FiShield, FiTruck } from 'react-icons/fi';
import { useCart } from '../context/CartContext.jsx';
import { astraviaProducts, formatAstraviaPrice, getAstraviaProduct } from '../data/astraviaProducts.js';
import '../styles/collection.css';

const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
const swatches = ['#050505', '#f5f1e8', '#727176'];
const wishlistStorageKey = 'astravia_wishlist';

const readWishlist = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(wishlistStorageKey) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, openCart } = useCart();
  const product = getAstraviaProduct(id);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [activeThumb, setActiveThumb] = useState(0);
  const [selectedColor, setSelectedColor] = useState(swatches[0]);
  const [isWishlisted, setIsWishlisted] = useState(() => readWishlist().some((item) => item.id === product.id));

  const thumbnails = useMemo(() => {
    const related = astraviaProducts.filter((item) => item.id !== product.id).slice(0, 4);
    return [product, ...related];
  }, [product]);

  const activeImage = thumbnails[activeThumb]?.image || product.image;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      size: selectedSize,
      quantity,
    });
    openCart();
  };

  const handleBuyNow = () => {
    const item = {
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      oldPrice: Math.round(Number(product.price || 0) * 1.35),
      color: selectedColor === '#f5f1e8' ? 'Cream' : selectedColor === '#727176' ? 'Grey' : 'Black',
      size: selectedSize,
      quantity,
    };
    const subtotal = Number(product.price || 0) * quantity;
    const shipping = 250;
    const discount = Math.round(subtotal * 0.2);
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
    const saved = readWishlist();
    const exists = saved.some((item) => item.id === product.id);
    const next = exists
      ? saved.filter((item) => item.id !== product.id)
      : [
          ...saved,
          {
            id: product.id,
            name: product.name,
            label: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            selectedSize,
            sizes,
            saved: 'Saved just now',
          },
        ];

    localStorage.setItem(wishlistStorageKey, JSON.stringify(next));
    setIsWishlisted(!exists);
  };

  return (
    <section className="product-detail-page">
      <div className="product-detail-shell">
        <div className="product-breadcrumb">
          <Link to="/collection">Collection</Link>
          <span>/</span>
          <strong>{product.name}</strong>
        </div>

        <div className="product-detail-layout">
          <div className="product-thumbnails" aria-label="Product thumbnails">
            {thumbnails.map((thumb, index) => (
              <button
                type="button"
                className={index === activeThumb ? 'active' : ''}
                key={`${thumb.id}-${index}`}
                onClick={() => setActiveThumb(index)}
              >
                <img src={thumb.image} alt={thumb.name} />
              </button>
            ))}
          </div>

          <div className="product-main-panel">
            <img src={activeImage} alt={product.name} />
            <span aria-hidden="true" />
          </div>

          <aside className="product-info-panel">
            <div className="limited-badge">Limited Edition</div>
            <h1>{product.name}</h1>
            <div className="product-rating">
              <span>★★★★★</span>
              <small>128 Reviews</small>
            </div>
            <div className="detail-price">{formatAstraviaPrice(product.price)}</div>
            <p>{product.description} Cut from heavyweight cotton with a structured oversized fit and premium Astravia finish.</p>

            <div className="detail-option">
              <h2>Color</h2>
              <div className="detail-swatches">
                {swatches.map((color) => (
                  <button
                    type="button"
                    className={selectedColor === color ? 'active' : ''}
                    style={{ background: color }}
                    key={color}
                    aria-label={`Select ${color}`}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

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

            <div className="detail-option">
              <h2>Quantity</h2>
              <div className="detail-quantity">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity">-</button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity((value) => Math.min(10, value + 1))} aria-label="Increase quantity">+</button>
              </div>
            </div>

            <button className="detail-add-cart" type="button" onClick={handleAddToCart}>Add To Cart</button>
            <button className="detail-buy-now" type="button" onClick={handleBuyNow}>Buy It Now</button>
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

        <div className="product-story-grid">
          {[
            ['Premium Quality', 'Heavyweight cotton chosen for shape, drape, and long-term wear.'],
            ['High Quality Print', 'Sharp graphic application with deep contrast and long-lasting color.'],
            ['Signature Detail', 'Astravia campaign artwork, oversized fit, and limited drop finishing.'],
          ].map(([title, text]) => (
            <article key={title}>
              <FiShield aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
