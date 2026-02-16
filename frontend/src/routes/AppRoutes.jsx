import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import Signup from '../pages/Signup.jsx';
import Men from '../pages/Men.jsx';
import Women from '../pages/Women.jsx';
import Accessories from '../pages/Accessories.jsx';
import SearchResults from '../pages/SearchResults.jsx';
import Wishlist from '../pages/Wishlist.jsx';

// Centralized route configuration.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/men" element={<Men />} />
      <Route path="/women" element={<Women />} />
      <Route path="/accessories" element={<Accessories />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/wishlist" element={<Wishlist />} />
    </Routes>
  );
}
