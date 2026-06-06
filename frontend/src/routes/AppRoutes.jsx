import { Navigate, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import Signup from '../pages/Signup.jsx';
import SearchResults from '../pages/SearchResults.jsx';
import Wishlist from '../pages/Wishlist.jsx';
import Sales from '../pages/Sales.jsx';
import GiftVoucher from '../pages/GiftVoucher.jsx';
import Collection from '../pages/Collection.jsx';
import Contact from '../pages/Contact.jsx';
import SizeGuide from '../pages/SizeGuide.jsx';
import Returns from '../pages/Returns.jsx';
import FAQ from '../pages/FAQ.jsx';
import Support from '../pages/Support.jsx';
import About from '../pages/About.jsx';
import ProductDetails from '../pages/ProductDetails.jsx';
import Checkout from '../pages/Checkout.jsx';
import Payment from '../pages/Payment.jsx';
import OrderSuccess from '../pages/OrderSuccess.jsx';
import OrderTracking from '../pages/OrderTracking.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import AuthSuccess from '../pages/AuthSuccess.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';


// Centralized route configuration.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/auth/success" element={<AuthSuccess />} />
      <Route path="/men" element={<Navigate to="/collection" replace />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/sales" element={<Sales />} />
      <Route path="/giftvoucher" element={<GiftVoucher />} />
      <Route path="/collection" element={<Collection />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/sizeguide" element={<SizeGuide />} />
      <Route path="/returns" element={<Returns />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/support" element={<Support />} />
      <Route path="/about" element={<About />} />
      <Route path="/new-arrivals" element={<Navigate to="/collection" replace />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        }
      />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route
        path="/orders/track"
        element={
          <ProtectedRoute>
            <OrderTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/order-tracking"
        element={
          <ProtectedRoute>
            <OrderTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute admin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
    </Routes>
  );
}
