import { Link } from 'react-router-dom';

export default function HomeNav({ cartCount = 2 }) {
  return (
    <nav>
      <Link to="/" className="nav-logo">
        <img src="/models/logo.png" alt="Astravia" />
      </Link>
      <ul className="nav-links">
        <li>
          <a href="#products">Collection</a>
        </li>
        <li>
          <a href="#advisor">Style AI</a>
        </li>
        <li>
          <a href="#size">Size Finder</a>
        </li>
        <li>
          <a href="#reviews">Reviews</a>
        </li>
      </ul>
      <div className="nav-right">
        <a href="#products" className="nav-icon" title="Search">
          &#9906;
        </a>
        <Link to="/checkout" className="nav-icon" title="Cart">
          &#128722;<span className="cart-badge">{cartCount}</span>
        </Link>
      </div>
    </nav>
  );
}
