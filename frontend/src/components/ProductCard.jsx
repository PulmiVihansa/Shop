// Product card for grid listings.
export default function ProductCard({ product }) {
  return (
    <div className="product-card">
      <div className="product-image">Image</div>
      <div className="product-info">
        <h3>{product.title}</h3>
        <p className="product-category">{product.category}</p>
        <p className="product-price">LKR{product.price}</p>
      </div>
    </div>
  );
}
