import { useLocation } from 'react-router-dom';
import Header from './components/Header/Header.jsx';
import Footer from './components/Footer/Footer.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

// Global app layout with header, routed pages, and footer.
export default function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="app-shell">
      {!isHome && <Header />}
      <main className="main-content" style={isHome ? { padding: 0 } : undefined}>
        <AppRoutes />
      </main>
      {!isHome && <Footer />}
    </div>
  );
}
