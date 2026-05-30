import { useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer/Footer.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import { CartProvider } from './context/CartContext.jsx';
import VisualCmsRuntime from './cms/VisualCmsRuntime.jsx';

// Global app layout with header, routed pages, and footer.
export default function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isContact = location.pathname === '/contact';
  const isSizeGuide = location.pathname === '/sizeguide';
  const isReturns = location.pathname === '/returns';
  const isAbout = location.pathname === '/about';
  const isNewArrivals = location.pathname === '/new-arrivals';
  const isMenNewArrivals = location.pathname === '/men-new-arrivals';
  const isMenShirts = location.pathname === '/men-shirts';
  const isMenTrousers = location.pathname === '/men-trousers';
  const isAccessories = location.pathname === '/accessories';
  const isWomen = location.pathname === '/women';
  const isTops = location.pathname === '/tops';
  const isAdmin = location.pathname.startsWith('/admin');
  const hideHeader = isHome || location.pathname === '/login' || isAdmin;

  return (
    <CartProvider>
      <div className="app-shell">
        <VisualCmsRuntime>
          {!hideHeader && <Header />}
          <main
            className="main-content"
            style={
              isHome ||
              isContact ||
              isSizeGuide ||
              isReturns ||
              isAbout ||
              isNewArrivals ||
              isWomen ||
              isTops ||
              isAdmin ||
              isMenNewArrivals ||
              isMenShirts ||
              isMenTrousers ||
              isAccessories
                ? { padding: 0 }
                : undefined
            }
          >
            <AppRoutes />
          </main>
          {!isHome && !isAdmin && <Footer />}
        </VisualCmsRuntime>
      </div>
    </CartProvider>
  );
}
