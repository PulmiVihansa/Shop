import { useMemo, useState } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer/Footer.jsx';
import Home from '../pages/Home.jsx';
import Men from '../pages/Men.jsx';
import Women from '../pages/Women.jsx';
import Accessories from '../pages/Accessories.jsx';
import SearchResults from '../pages/SearchResults.jsx';
import Wishlist from '../pages/Wishlist.jsx';
import Sales from '../pages/Sales.jsx';
import GiftVoucher from '../pages/GiftVoucher.jsx';
import Contact from '../pages/Contact.jsx';
import SizeGuide from '../pages/SizeGuide.jsx';
import Returns from '../pages/Returns.jsx';
import About from '../pages/About.jsx';
import NewArrivals from '../pages/NewArrivals.jsx';
import Tops from '../pages/Tops.jsx';
import MenNewArrivals from '../pages/MenNewArrivals.jsx';
import MenShirts from '../pages/MenShirts.jsx';
import MenTrousers from '../pages/MenTrousers.jsx';
import Checkout from '../pages/Checkout.jsx';
import OrderSuccess from '../pages/OrderSuccess.jsx';
import OrderTracking from '../pages/OrderTracking.jsx';
import VisualCmsRuntime from './VisualCmsRuntime.jsx';
import { editablePageOptions } from './visualCmsKeys.js';

const pageComponents = {
  '/': Home,
  '/men': Men,
  '/women': Women,
  '/accessories': Accessories,
  '/search': SearchResults,
  '/wishlist': Wishlist,
  '/sales': Sales,
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
  '/checkout': Checkout,
  '/order-success': OrderSuccess,
  '/orders/track': OrderTracking,
};

const fullChromePages = new Set(['/']);

const isPreviewNavigationBlocked = (target) =>
  Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"], .vcms-controls, .vcms-image-upload'));

const normalizePathname = (value) => {
  if (!value) return '/';
  try {
    const url = new URL(value, window.location.origin);
    return url.pathname || '/';
  } catch {
    return value.startsWith('/') ? value : '/';
  }
};

export default function AdminVisualCmsEmbed() {
  const [previewPath, setPreviewPath] = useState('/');
  const Page = useMemo(() => pageComponents[previewPath] || Home, [previewPath]);
  const usesOwnChrome = fullChromePages.has(previewPath);

  const handlePreviewClickCapture = (event) => {
    if (isPreviewNavigationBlocked(event.target)) return;

    const anchor = event.target.closest?.('a[href]');
    if (!anchor) return;

    const href = anchor.getAttribute('href') || '';
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;

    const nextPath = normalizePathname(href);
    if (!nextPath || nextPath === previewPath) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    setPreviewPath(nextPath);
  };

  return (
    <div className="admin-cms">
      <div className="admin-cms-toolbar">
        <div className="admin-cms-toolbar-left">
          <span className="admin-eyebrow">Visual CMS</span>
          <strong>Live Editable Website</strong>
        </div>
        <div className="admin-cms-toolbar-pages" role="navigation" aria-label="Editable pages">
          {editablePageOptions.map(([path, label]) => (
            <button
              key={path}
              type="button"
              className={previewPath === path ? 'active' : ''}
              onClick={() => setPreviewPath(path)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-cms-preview" onClickCapture={handlePreviewClickCapture}>
        <VisualCmsRuntime admin previewPath={previewPath}>
          {!usesOwnChrome && <Header pathnameOverride={previewPath} />}
          <Page />
          {!usesOwnChrome && <Footer />}
        </VisualCmsRuntime>
      </div>
    </div>
  );
}
