import { Link } from 'react-router-dom';
import { buildWhatsAppOrderLink } from '../utils/whatsapp.js';

const toList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

// Product card for grid listings.
export default function ProductCard({ product }) {
  const colors = toList(product?.colors || product?.swatches || product?.colours);
  return (
    <article className="product-card">
      <div className="product-image">Image</div>
      <div className="product-info">
        <Link to={`/products/${product?.id || ''}`} className="product-title-link">
          <h3>{product.title}</h3>
        </Link>
        <p className="product-category">{product.collection} · {product.category}</p>
        <p className="product-price">LKR{product.price}</p>
        <p className="product-colors">{colors.slice(0, 3).join(' · ') || 'No colours listed'}</p>
        <a
          className="product-whatsapp"
          href={buildWhatsAppOrderLink(import.meta.env.VITE_STORE_WHATSAPP, product, product.sizes?.[0] || 'M')}
          target="_blank"
          rel="noreferrer"
        >
          Order via WhatsApp
        </a>
      </div>
    </article>
  );
}
