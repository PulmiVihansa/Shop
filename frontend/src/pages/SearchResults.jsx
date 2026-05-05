import { useLocation } from 'react-router-dom';
import useProducts from '../hooks/useProducts.js';

export default function SearchResults() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const query = params.get('q') || '';
  const { products, loading, error } = useProducts({ query });

  return (
    <section className="page search-results">
      <h1>Search Results</h1>
      <p>Showing results for "{query}"</p>
      <div className={`product-grid ${products.length ? '' : 'empty'}`}>
        {loading && <p>Loading results...</p>}
        {error && <p>{error}</p>}
        {!loading && products.length === 0 && <p>No products found.</p>}
        {products.map((product) => (
          <div className="product-card" key={product.id}>
            <div className="product-image">Image</div>
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="product-category">{product.category}</p>
              <p className="product-price">LKR{Number(product.price).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
