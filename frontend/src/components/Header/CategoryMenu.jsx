import { NavLink } from 'react-router-dom';

// Primary category navigation.
export default function CategoryMenu() {
  return (
    <nav className="category-menu">
      <NavLink to="/collection">Men</NavLink>
    </nav>
  );
}
