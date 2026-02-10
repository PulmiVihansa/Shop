import { useLocation } from 'react-router-dom';

// Search results placeholder page.
export default function SearchResults() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const query = params.get('q') || '';

  return (
    <section className="page search-results">
      <h1>Search Results</h1>
      <p>Showing results for "{query}"</p>
      <div className="product-grid empty">
        <p>No results yet. Connect to the backend when ready.</p>
      </div>
    </section>
  );
}
