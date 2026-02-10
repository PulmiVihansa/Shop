import { Link } from 'react-router-dom';
import SearchBar from './SearchBar.jsx';
import CategoryMenu from './CategoryMenu.jsx';

// Site header with logo, navigation, search, and auth actions.
export default function Header() {
  return (
    <header className="site-header">
      <div className="logo">
        <Link to="/">SHOP</Link>
      </div>
      <CategoryMenu />
      <SearchBar />
      <div className="auth-actions">
        <Link to="/login" className="btn btn-ghost">Login</Link>
        <Link to="/signup" className="btn btn-primary">Sign Up</Link>
      </div>
    </header>
  );
}
