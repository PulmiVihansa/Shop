import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="not-found-page">
      <div>
        <p>404</p>
        <h1>Page not found.</h1>
        <span>The drop you are looking for is not here anymore.</span>
        <Link to="/collection">Shop collection</Link>
      </div>
    </section>
  );
}
