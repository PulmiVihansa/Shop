import ProductCard from '../components/ProductCard.jsx';

// Home page with hero, categories, and product grid placeholders.
export default function Home() {
  const products = [
    { id: 1, title: 'Classic Denim Jacket', price: 89, category: 'Men' },
    { id: 2, title: 'Summer Floral Dress', price: 74, category: 'Women' },
    { id: 3, title: 'Minimalist Sneakers', price: 110, category: 'Accessories' },
    { id: 4, title: 'Relaxed Hoodie', price: 58, category: 'Men' },
    { id: 5, title: 'Wide-Leg Trousers', price: 95, category: 'Women' },
    { id: 6, title: 'Leather Belt', price: 35, category: 'Accessories' }
  ];

  return (
    <section className="page home">
      <div className="hero">
        <div className="hero-content">
          <h1>New Season, New Style</h1>
          <p>Discover curated fits for every day.</p>
          <button className="btn btn-primary">Shop New Arrivals</button>
        </div>
      </div>

      <div className="featured-categories">
        <h2>Featured Categories</h2>
        <div className="category-grid">
          <div className="category-tile">Men Essentials</div>
          <div className="category-tile">Women Highlights</div>
          <div className="category-tile">Accessories Edit</div>
        </div>
      </div>

      <div className="product-grid-section">
        <h2>Trending Products</h2>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
