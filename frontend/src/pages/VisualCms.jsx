import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer/Footer.jsx';
import Home from './Home.jsx';
import Women from './Women.jsx';
import Accessories from './Accessories.jsx';
import GiftVoucher from './GiftVoucher.jsx';
import Contact from './Contact.jsx';
import SizeGuide from './SizeGuide.jsx';
import Returns from './Returns.jsx';
import About from './About.jsx';
import NewArrivals from './NewArrivals.jsx';
import Tops from './Tops.jsx';
import MenNewArrivals from './MenNewArrivals.jsx';
import MenShirts from './MenShirts.jsx';
import MenTrousers from './MenTrousers.jsx';
import Sales from './Sales.jsx';
import Wishlist from './Wishlist.jsx';
import VisualCmsRuntime from '../cms/VisualCmsRuntime.jsx';
import { editablePageOptions } from '../cms/visualCmsKeys.js';

const pageComponents = {
  '/': Home,
  '/women': Women,
  '/accessories': Accessories,
  '/giftvoucher': GiftVoucher,
  '/contact': Contact,
  '/sizeguide': SizeGuide,
  '/returns': Returns,
  '/about': About,
  '/new-arrivals': NewArrivals,
  '/tops': Tops,
  '/men-new-arrivals': MenNewArrivals,
  '/men-shirts': MenShirts,
  '/men-trousers': MenTrousers,
  '/sales': Sales,
  '/wishlist': Wishlist,
};

const fullChromePages = new Set(['/']);

export default function VisualCms() {
  const [previewPath, setPreviewPath] = useState('/');
  const navigate = useNavigate();
  const Page = useMemo(() => pageComponents[previewPath] || Home, [previewPath]);
  const usesOwnChrome = fullChromePages.has(previewPath);

  return (
    <div className="visual-cms-shell">
      <aside className="visual-cms-sidebar">
        <div className="visual-cms-brand">ATELIER<span>Visual CMS</span></div>
        <nav className="visual-cms-nav">
          {editablePageOptions.map(([path, label]) => (
            <button
              type="button"
              className={previewPath === path ? 'active' : ''}
              key={path}
              onClick={() => setPreviewPath(path)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="visual-cms-tools">
          <span className="visual-cms-label">Live Editing</span>
          <p>Click text to edit. Hover images to replace. Hover sections to reorder or remove. Use Add Section in the preview.</p>
          <button type="button" className="visual-cms-back" onClick={() => navigate('/admin')}>
            Back to Admin
          </button>
        </div>
      </aside>
      <main className="visual-cms-preview">
        <VisualCmsRuntime admin previewPath={previewPath}>
          {!usesOwnChrome && <Header />}
          <Page isAdmin />
          {!usesOwnChrome && <Footer />}
        </VisualCmsRuntime>
      </main>
    </div>
  );
}
