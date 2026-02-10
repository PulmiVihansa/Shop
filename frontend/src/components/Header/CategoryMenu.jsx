import { NavLink } from 'react-router-dom';

// Primary category navigation.
export default function CategoryMenu() {
  return (
    <nav className="category-menu">
      <NavLink to="/men">Men</NavLink>
      <NavLink to="/women">Women</NavLink>
      <NavLink to="/accessories">Accessories</NavLink>
    </nav>
  );
}
