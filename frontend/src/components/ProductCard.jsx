import { buildWhatsAppOrderLink } from '../utils/whatsapp.js';

// Product card for grid listings.
export default function ProductCard({ product }) {
  return (
    <div className="product-card">
      <div className="product-image">Image</div>
      <div className="product-info">
        <h3>{product.title}</h3>
        <p className="product-category">{product.category}</p>
        <p className="product-price">LKR{product.price}</p>
        <a
          className="product-whatsapp"
          href={buildWhatsAppOrderLink(import.meta.env.VITE_STORE_WHATSAPP, product, product.sizes?.[0] || 'M')}
          target="_blank"
          rel="noreferrer"
        >
          Order via WhatsApp
        </a>
      </div>
    </div>
  );
}
