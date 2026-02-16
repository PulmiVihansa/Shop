import { useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer/Footer.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import { CartProvider } from './context/CartContext.jsx';

// Global app layout with header, routed pages, and footer.
export default function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const hideHeader = isHome || location.pathname === '/login';

  return (
    <CartProvider>
      <div className="app-shell">
        {!hideHeader && <Header />}
        <main className="main-content" style={isHome ? { padding: 0 } : undefined}>
          <AppRoutes />
        </main>
        {!isHome && <Footer />}
      </div>
    </CartProvider>
  );
}
