import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer/Footer.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import { CartProvider } from './context/CartContext.jsx';

// Global app layout with header, routed pages, and footer.
export default function App() {
  const location = useLocation();
  const [introActive, setIntroActive] = useState(false);
  const isHome = location.pathname === '/';
  const isLogin = location.pathname === '/login';
  const isSignup = location.pathname === '/signup';
  const isPasswordAuth = location.pathname === '/forgot-password' || location.pathname.startsWith('/reset-password/');
  const isAccount = location.pathname === '/account';
  const isWishlist = location.pathname === '/wishlist';
  const isContact = location.pathname === '/contact';
  const isSizeGuide = location.pathname === '/sizeguide';
  const isReturns = location.pathname === '/returns';
  const isAbout = location.pathname === '/about';
  const isCollection = location.pathname === '/collection';
  const isProductDetails = location.pathname.startsWith('/products/');
  const isCheckout = location.pathname === '/checkout';
  const isPayment = location.pathname === '/payment';
  const isAdmin = location.pathname.startsWith('/admin');
  const hideHeader = isAdmin || (isHome && introActive);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  useEffect(() => {
    const handleIntroActive = (event) => {
      setIntroActive(Boolean(event.detail?.active));
    };

    window.addEventListener('astravia:intro-active', handleIntroActive);
    return () => window.removeEventListener('astravia:intro-active', handleIntroActive);
  }, []);

  useEffect(() => {
    if (!isHome && introActive) setIntroActive(false);
  }, [introActive, isHome]);

  useEffect(() => {
    if (isAdmin) return undefined;
    if (!window.matchMedia?.('(pointer: fine)').matches) return undefined;

    const cursor = document.getElementById('cursor');
    const ring = document.getElementById('cursorRing');
    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;
    let frameId;

    const handleMouseMove = (event) => {
      mx = event.clientX;
      my = event.clientY;
      if (cursor) cursor.style.transform = `translate3d(${mx - 6}px, ${my - 6}px, 0)`;
    };

    const handlePointerOver = (event) => {
      if (event.target.closest?.('a,button,input,textarea,select,.product-card,.luxury-product-card,.tip-card,.model-card,.filter-btn')) {
        cursor?.classList.add('expand');
        ring?.classList.add('expand');
      }
    };

    const handlePointerOut = (event) => {
      if (event.target.closest?.('a,button,input,textarea,select,.product-card,.luxury-product-card,.tip-card,.model-card,.filter-btn')) {
        cursor?.classList.remove('expand');
        ring?.classList.remove('expand');
      }
    };

    const animateRing = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (ring) ring.style.transform = `translate3d(${rx - 18}px, ${ry - 18}px, 0)`;
      frameId = requestAnimationFrame(animateRing);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseover', handlePointerOver);
    document.addEventListener('mouseout', handlePointerOut);
    animateRing();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handlePointerOver);
      document.removeEventListener('mouseout', handlePointerOut);
      cancelAnimationFrame(frameId);
    };
  }, [isAdmin]);

  return (
    <CartProvider>
      <div className="app-shell">
        {!isAdmin && (
          <>
            <div className="cursor" id="cursor" />
            <div className="cursor-ring" id="cursorRing" />
          </>
        )}
        {!hideHeader && <Header />}
        <main
          className="main-content"
          style={
            isHome ||
            isContact ||
            isLogin ||
            isSignup ||
            isPasswordAuth ||
            isAccount ||
            isWishlist ||
            isSizeGuide ||
            isReturns ||
            isAbout ||
            isCollection ||
            isProductDetails ||
            isCheckout ||
            isPayment ||
            isAdmin
              ? { padding: 0 }
              : undefined
          }
        >
          <AppRoutes />
        </main>
        {!isLogin && !isSignup && !isPasswordAuth && !isCheckout && !isPayment && !isAdmin && <Footer />}
      </div>
    </CartProvider>
  );
}
