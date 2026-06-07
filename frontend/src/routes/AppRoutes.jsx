import { Suspense, lazy } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

const Home = lazy(() => import('../pages/Home.jsx'));
const Login = lazy(() => import('../pages/Login.jsx'));
const Signup = lazy(() => import('../pages/Signup.jsx'));
const SearchResults = lazy(() => import('../pages/SearchResults.jsx'));
const Account = lazy(() => import('../pages/Account.jsx'));
const Wishlist = lazy(() => import('../pages/Wishlist.jsx'));
const Sales = lazy(() => import('../pages/Sales.jsx'));
const GiftVoucher = lazy(() => import('../pages/GiftVoucher.jsx'));
const Collection = lazy(() => import('../pages/Collection.jsx'));
const Contact = lazy(() => import('../pages/Contact.jsx'));
const SizeGuide = lazy(() => import('../pages/SizeGuide.jsx'));
const Returns = lazy(() => import('../pages/Returns.jsx'));
const FAQ = lazy(() => import('../pages/FAQ.jsx'));
const Support = lazy(() => import('../pages/Support.jsx'));
const About = lazy(() => import('../pages/About.jsx'));
const ProductDetails = lazy(() => import('../pages/ProductDetails.jsx'));
const Checkout = lazy(() => import('../pages/Checkout.jsx'));
const Payment = lazy(() => import('../pages/Payment.jsx'));
const OrderSuccess = lazy(() => import('../pages/OrderSuccess.jsx'));
const OrderTracking = lazy(() => import('../pages/OrderTracking.jsx'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard.jsx'));
const AuthSuccess = lazy(() => import('../pages/AuthSuccess.jsx'));
const NotFound = lazy(() => import('../pages/NotFound.jsx'));
const PolicyPage = lazy(() => import('../pages/PolicyPage.jsx'));

function RouteFallback() {
  return <div className="route-loading" aria-label="Loading page" />;
}

// Centralized route configuration.
export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/success" element={<AuthSuccess />} />
        <Route path="/men" element={<Navigate to="/collection" replace />} />
        <Route path="/search" element={<SearchResults />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
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
        <Route path="/privacy" element={<PolicyPage />} />
        <Route path="/terms" element={<PolicyPage />} />
        <Route path="/shipping" element={<PolicyPage />} />
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
        <Route path="/admin/bulk-orders" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/marketing" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/cms" element={<Navigate to="/admin" replace />} />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute admin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
