import Header from './components/Header/Header.jsx';
import Footer from './components/Footer/Footer.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

// Global app layout with header, routed pages, and footer.
export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}
