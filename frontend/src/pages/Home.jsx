import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { FiCheck, FiLock, FiRefreshCw, FiShield, FiTruck, FiUpload } from 'react-icons/fi';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../context/CartContext.jsx';
import { compressTryOnImage, generateVirtualTryOn } from '../services/aiTryOn.js';
import { fetchProducts, productsQueryDefaults } from '../services/productsQueries.js';
import { prefetchSalesProducts } from '../services/salesQueries.js';
import { resolveImageUrl } from '../utils/imageUrl.js';
import { getAvailableSizes } from '../utils/availableSizes.js';
import '../styles/home.css';

gsap.registerPlugin(ScrollTrigger);

const LightPillar = lazy(() => import('../components/home/LightPillar.jsx'));
const TShirtExperience = lazy(() => import('../components/home/TShirtExperience.jsx'));
const IntroVideoGate = lazy(() => import('../components/home/IntroVideoGate.jsx'));

const products = [
  {
    name: 'Break Rules Tee',
    sub: 'Oversized Graphic - Black',
    price: '3,800',
    cat: 'graphic limited',
    bg: undefined,
    badge: 'New Drop',
    badgeClass: 'badge-new',
    glow: 'drop-shadow(0 10px 40px rgba(200,0,42,0.3))',
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    name: 'Phantom Navy Tee',
    sub: 'Heavyweight Oversized - Navy',
    price: '4,200',
    cat: 'oversized',
    bg: '#0a0a12',
    badge: 'Hot',
    badgeClass: 'badge-hot',
    glow: 'drop-shadow(0 10px 40px rgba(30,60,200,0.2))',
    sizes: ['M', 'L', 'XL'],
  },
  {
    name: 'Blood Script Tee',
    sub: 'Limited Edition - Red Print',
    price: '4,900',
    cat: 'graphic limited',
    bg: '#0f0808',
    badge: 'Limited',
    badgeClass: 'badge-new',
    glow: 'drop-shadow(0 10px 40px rgba(200,0,42,0.5))',
    sizes: ['L', 'XL'],
  },
  {
    name: 'Charcoal Oversized Tee',
    sub: 'Oversized - Washed Olive',
    price: '2,800',
    oldPrice: '3,500',
    cat: 'oversized sale',
    bg: '#0a0f0a',
    badge: 'Sale',
    badgeClass: 'badge-hot',
    sizes: ['S', 'M', 'L'],
  },
  {
    name: 'Ghost Type Tee',
    sub: 'Graphic - Cream White',
    price: '3,600',
    cat: 'graphic',
    bg: '#0d0d0d',
    glow: 'drop-shadow(0 10px 30px rgba(255,255,255,0.1))',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    name: 'Shadow Box Tee',
    sub: "Collector's Edition - Black",
    price: '5,500',
    cat: 'limited',
    bg: '#080808',
    badge: 'Sold Out',
    badgeClass: 'badge-sold',
    soldOut: true,
    sizes: [],
  },
];

const filters = [
  ['All Drops', 'all'],
  ['Graphic Tees', 'graphic'],
  ['Oversized', 'oversized'],
  ['Limited', 'limited'],
  ['On Sale', 'sale'],
];

const tryOnProducts = [
  { id: 'void-tee', name: 'Void Tee', price: '4,490', image: '/models/Tshirt6.png', vibe: 'minimal' },
  { id: 'shadow-tee', name: 'Shadow Tee', price: '4,690', image: '/models/Tshirt7.png', vibe: 'night' },
  { id: 'phantom-tee', name: 'Phantom Tee', price: '4,200', image: '/models/Tshirt11.png', vibe: 'minimal' },
  { id: 'break-rules-tee', name: 'Break Rules Tee', price: '5,290', image: '/models/Tshirt5.png', vibe: 'statement' },
  { id: 'ghost-type-tee', name: 'Astravia Tee', price: '3,600', image: '/models/Tshirt22.png', vibe: 'daily' },
  { id: 'chaos-tee', name: 'Rebel Tee', price: '4,990', image: '/models/Tshirt8.png', vibe: 'statement' },
];

const dropLabModes = [
  {
    id: 'night-run',
    label: 'Night Run',
    productIndex: 1,
    headline: 'Low light, high impact.',
    brief: 'Built for night plans, black denim, silver chain, and one loud graphic doing the talking.',
    palette: ['#050505', '#ff1f3d', '#d8d4cc'],
    stats: [
      ['Fit Match', 94],
      ['Statement', 91],
      ['Versatility', 78],
    ],
    kit: ['Black denim', 'Chrome accessories', 'Chunky sneakers'],
  },
  {
    id: 'daily-uniform',
    label: 'Daily Uniform',
    productIndex: 0,
    headline: 'Clean enough for every day.',
    brief: 'A quiet oversized base for coffee runs, campus days, or errands that still need intent.',
    palette: ['#f5f0e8', '#4d4d4d', '#a8a095'],
    stats: [
      ['Fit Match', 89],
      ['Comfort', 96],
      ['Repeat Wear', 93],
    ],
    kit: ['Wide-leg cargos', 'Minimal watch', 'White sneakers'],
  },
  {
    id: 'main-character',
    label: 'Main Character',
    productIndex: 5,
    headline: 'For when subtle is cancelled.',
    brief: 'A bolder pick for drops, photos, parties, and any outfit that needs a center of gravity.',
    palette: ['#111111', '#ff4d5f', '#f4d35e'],
    stats: [
      ['Fit Match', 92],
      ['Photo Energy', 97],
      ['Limited Feel', 88],
    ],
    kit: ['Stacked rings', 'Relaxed trousers', 'High-top sneakers'],
  },
];

const aiResponses = {
  default: [
    "Based on your vibe, I'd go with the Break Rules Tee - black, bold graphic, oversized. That's the one.",
    'That is giving Blood Script Tee energy - limited edition, red print, makes a statement without saying a word.',
    'The Phantom Navy Tee is calling your name. Heavyweight fabric, clean drop, works for anything.',
    'Honestly? The Ghost Type Tee - cream on black, subtle flex, versatile enough for any occasion.',
  ],
  night: 'Night out? Break Rules Tee or Blood Script Tee. Pair with black tailored trousers and chunky sneakers. That fit is locked.',
  casual: 'Casual day? Ghost Type Tee in cream - pair it with olive joggers and clean white shoes. Effortless but intentional.',
  statement: "Blood Script Tee. Limited run, red print on black. One piece, whole outfit. That's your statement.",
  minimal: 'Ghost Type Tee - cream white, subtle typography, premium GSM. Clean, minimal, confident. No need for anything loud.',
};

let featuredProductsCache = null;

const formatHomePrice = (value) => Number(value || 0).toLocaleString();

const normalizeFeaturedProduct = (entry, index) => {
  const product = entry.product || entry;
  const image = resolveImageUrl(entry.featureImage || entry.stackImage || entry.image || product.images?.[0] || product.image || '');
  const sizeStock = product.sizeStock || entry.sizeStock || {};
  const rawSizes = product.sizes?.length ? product.sizes : entry.sizes || [];
  return {
    id: entry.productId || product.id || product._id || entry.id || entry._id,
    number: index + 1,
    name: entry.productName || product.name || entry.name || 'Astravia Product',
    stackImage: image,
    featureImage: image,
    description: product.description || entry.description || 'Premium Astravia piece with a clean oversized streetwear silhouette.',
    fabric: product.fabric || 'Premium Fabric',
    fit: product.fit || 'Astravia Fit',
    limited: product.badges?.[0] || entry.badge || 'Featured Drop',
    price: formatHomePrice(product.price || entry.price),
    sizes: getAvailableSizes({ sizes: rawSizes, sizeStock }),
    sizeStock,
    sub: product.category || entry.category || '',
  };
};

function getAIResponse(message) {
  const text = message.toLowerCase();
  if (text.includes('night') || text.includes('edgy') || text.includes('dark')) return aiResponses.night;
  if (text.includes('casual') || text.includes('day') || text.includes('chill')) return aiResponses.casual;
  if (text.includes('statement') || text.includes('bold') || text.includes('loud')) return aiResponses.statement;
  if (text.includes('minimal') || text.includes('clean') || text.includes('simple')) return aiResponses.minimal;
  return aiResponses.default[Math.floor(Math.random() * aiResponses.default.length)];
}

export default function Home() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { addItem, openCart } = useCart();
  const [introComplete, setIntroComplete] = useState(false);
  const [filter, setFilter] = useState('all');
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState(() => featuredProductsCache || []);
  const [featuredLoading, setFeaturedLoading] = useState(!featuredProductsCache);
  const [selectedSize, setSelectedSize] = useState('S');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      text: "Yo, what's good. Tell me your vibe - occasion, style, what you're feelin' - and I'll pick the perfect tee for you.",
    },
  ]);
  const [measurements, setMeasurements] = useState({ chest: '', shoulder: '', height: '', weight: '' });
  const [sizeResult, setSizeResult] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState(false);
  const [addedProduct, setAddedProduct] = useState('');
  const [notified, setNotified] = useState(false);
  const [tryOnImage, setTryOnImage] = useState('');
  const [tryOnFile, setTryOnFile] = useState(null);
  const [tryOnDataUrl, setTryOnDataUrl] = useState('');
  const [tryOnMeta, setTryOnMeta] = useState(null);
  const [tryOnResult, setTryOnResult] = useState('');
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnError, setTryOnError] = useState('');
  const [tryOnGlow, setTryOnGlow] = useState(false);
  const [tryOnProductIndex, setTryOnProductIndex] = useState(5);
  const [tryOnCompare, setTryOnCompare] = useState(50);
  const [activeDropLabIndex, setActiveDropLabIndex] = useState(0);
  const tryOnInputRef = useRef(null);

  const visibleProducts = useMemo(() => {
    if (filter === 'all') return products;
    return products.filter((product) => product.cat.includes(filter));
  }, [filter]);

  const orderedFeaturedProducts = useMemo(() => {
    if (!featuredProducts.length) return [];
    const safeActiveIndex = Math.min(activeProductIndex, featuredProducts.length - 1);
    return [
      { ...featuredProducts[safeActiveIndex], originalIndex: safeActiveIndex },
      ...featuredProducts.slice(0, safeActiveIndex).map((product, originalIndex) => ({ ...product, originalIndex })),
      ...featuredProducts.slice(safeActiveIndex + 1).map((product, offset) => ({
        ...product,
        originalIndex: safeActiveIndex + 1 + offset,
      })),
    ];
  }, [activeProductIndex, featuredProducts]);
  const activeProduct = orderedFeaturedProducts[0] || null;
  const activeProductSizes = activeProduct?.sizes || [];

  const stackRef = useRef(null);
  const panelRef = useRef(null);
  const selectedTryOnProduct = tryOnProducts[tryOnProductIndex] || tryOnProducts[0];
  const activeDropLabMode = dropLabModes[activeDropLabIndex] || dropLabModes[0];
  const activeDropLabProduct = tryOnProducts[activeDropLabMode.productIndex] || tryOnProducts[0];

  const featuredProductsQuery = useQuery({
    queryKey: ['products', 'featured', 5],
    queryFn: () => fetchProducts({ source: 'home', limit: 5 }),
    select: (data) => (Array.isArray(data) ? data.slice(0, 5).map(normalizeFeaturedProduct) : []),
    placeholderData: featuredProductsCache || [],
    ...productsQueryDefaults,
  });
  const featuredProductsFromQuery = featuredProductsQuery.data || [];
  const featuredLoadingFromQuery = featuredProductsQuery.isLoading && !featuredProductsFromQuery.length;

  useEffect(() => {
    prefetchSalesProducts(queryClient);
  }, [queryClient]);

  useEffect(() => {
    try {
      window.sessionStorage.removeItem('astravia_skip_intro');
    } catch {
      // Ignore blocked session storage.
    }

    if (location.state?.skipIntro) {
      setIntroComplete(true);
    }
  }, [location.state]);

  useEffect(() => {
    featuredProductsCache = featuredProductsFromQuery;
    setFeaturedProducts(featuredProductsFromQuery);
    setActiveProductIndex(0);
    setFeaturedLoading(featuredLoadingFromQuery);
  }, [featuredLoadingFromQuery, featuredProductsFromQuery]);

  useEffect(() => {
    if (!activeProduct) return;
    setSelectedSize((current) => (
      current && activeProductSizes.includes(current) ? current : activeProductSizes[0] || ''
    ));
  }, [activeProduct, activeProductSizes]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('astravia:intro-active', { detail: { active: !introComplete } }));
    return () => {
      window.dispatchEvent(new CustomEvent('astravia:intro-active', { detail: { active: false } }));
    };
  }, [introComplete]);

  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    reveals.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [visibleProducts.length]);

  useEffect(() => {
    if (!featuredProducts.length) return undefined;
    const context = gsap.context(() => {
      const scrollTrigger = ScrollTrigger.create({
        trigger: '#products',
        start: 'top 72%',
        end: 'bottom 35%',
        scrub: 0.7,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const nextIndex = Math.min(featuredProducts.length - 1, Math.floor(self.progress * featuredProducts.length));
          setActiveProductIndex(nextIndex);
        },
      });

      return () => {
        scrollTrigger.kill();
      };
    });

    return () => context.revert();
  }, [featuredProducts.length]);

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo(
        '.virtual-tryon-section .tryon-animate',
        { autoAlpha: 0, y: 42, force3D: true },
        {
          autoAlpha: 1,
          y: 0,
          force3D: true,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.virtual-tryon-section',
            start: 'top 72%',
            once: true,
          },
        },
      );
    });

    return () => context.revert();
  }, []);

  useEffect(() => {
    setTryOnResult('');
    setTryOnError('');
  }, [tryOnProductIndex]);

  const sendMsg = (message = chatInput) => {
    const value = message.trim();
    if (!value) return;
    setMessages((current) => [
      ...current,
      { type: 'user', text: value },
      { type: 'ai', text: getAIResponse(value) },
    ]);
    setChatInput('');
  };

  const findSize = () => {
    const chest = Number(measurements.chest);
    const weight = Number(measurements.weight);
    const calculatedChest = chest || weight * 0.5 + 50;
    const size = calculatedChest < 86 ? 'S' : calculatedChest < 96 ? 'M' : calculatedChest < 106 ? 'L' : calculatedChest < 116 ? 'XL' : 'XXL';
    setSelectedSize(size);
    setSizeResult(true);
  };

  const subscribe = () => {
    if (!newsletterEmail.includes('@')) {
      window.alert('Enter a valid email.');
      return;
    }
    setNewsletterEmail('');
    setNewsletterMessage(true);
  };

  const handleTryOnUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setTryOnError('');
    setTryOnResult('');

    if (file.size > 10 * 1024 * 1024) {
      setTryOnError('Max image size is 10MB. Please upload a smaller full-body photo.');
      return;
    }

    try {
      const { file: compressedFile, dataUrl, meta } = await compressTryOnImage(file);
      setTryOnFile(compressedFile);
      setTryOnDataUrl(dataUrl);
      setTryOnMeta(meta);
      const previewUrl = URL.createObjectURL(compressedFile);
      setTryOnImage(previewUrl);
      setTryOnGlow(true);
      window.setTimeout(() => setTryOnGlow(false), 900);
    } catch (error) {
      setTryOnError(error.message || 'Please upload a clear JPG or PNG full-body photo.');
      setTryOnFile(null);
      setTryOnDataUrl('');
      setTryOnMeta(null);
      setTryOnImage('');
    } finally {
      event.target.value = '';
    }
  };

  const handleGenerateTryOn = async ({ bypassCache = false } = {}) => {
    if (!tryOnFile) {
      setTryOnError('Upload a full-body photo first.');
      return;
    }

    setTryOnLoading(true);
    setTryOnError('');

    try {
      const result = await generateVirtualTryOn({
        userImageFile: tryOnFile,
        userImageDataUrl: tryOnDataUrl,
        productImageUrl: selectedTryOnProduct.image,
        productName: selectedTryOnProduct.name,
        size: selectedSize,
        humanMeta: tryOnMeta,
        bypassCache,
      });
      setTryOnResult(result.imageUrl);
      setTryOnCompare(50);
      setTryOnGlow(true);
      window.setTimeout(() => setTryOnGlow(false), 900);
    } catch (error) {
      setTryOnError(error.message || 'Astravia AI could not generate your try-on. Please try again.');
    } finally {
      setTryOnLoading(false);
    }
  };

  const handleTryOnAddToCart = () => {
    addItem({
      productId: `tryon-${selectedTryOnProduct.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: selectedTryOnProduct.name,
      price: Number(String(selectedTryOnProduct.price).replace(/,/g, '')),
      image: selectedTryOnProduct.image,
      size: selectedSize,
      quantity: 1,
    });
    openCart();
  };

  const handleDropLabAddToCart = () => {
    addItem({
      productId: `drop-lab-${activeDropLabProduct.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: activeDropLabProduct.name,
      price: Number(String(activeDropLabProduct.price).replace(/,/g, '')),
      image: activeDropLabProduct.image,
      size: selectedSize || 'M',
      quantity: 1,
    });
    openCart();
  };

  const handleDownloadTryOn = async () => {
    if (!tryOnResult) return;
    const link = document.createElement('a');
    link.download = `${selectedTryOnProduct.name.toLowerCase().replace(/\s+/g, '-')}-astravia-try-on.png`;
    try {
      const response = await fetch(tryOnResult);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      link.href = tryOnResult;
      link.target = '_blank';
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  return (
    <>
      {!introComplete && (
        <Suspense fallback={null}>
          <IntroVideoGate onFinish={() => setIntroComplete(true)} />
        </Suspense>
      )}

      <section className="hero">
        <div className="hero-light-pillar-background" aria-hidden="true">
          <Suspense fallback={<div className="hero-visual-fallback" aria-hidden="true" />}>
            <LightPillar
              topColor="#727176"
              bottomColor="#f17474"
              intensity={1}
              rotationSpeed={0.3}
              glowAmount={0.002}
              pillarWidth={3}
              pillarHeight={0.4}
              noiseIntensity={0.5}
              pillarRotation={25}
              interactive={false}
              mixBlendMode="screen"
              quality="high"
            />
          </Suspense>
        </div>
        <div className="hero-3d-layer" aria-hidden="true">
          {introComplete && (
            <Suspense fallback={<div className="hero-canvas hero-visual-fallback" aria-hidden="true" />}>
              <TShirtExperience className="hero-canvas" />
            </Suspense>
          )}
        </div>

        <div className="hero-left">
          <p className="hero-eyebrow">New Drop - SS 2026</p>
          <h1 className="hero-title">BREAK<br /><em>RULES</em><br />NOT STYLE</h1>
          <p className="hero-sub">Premium oversized tees built for men who don't follow the script. Crafted in Sri Lanka. Worn everywhere.</p>
          <div className="hero-ctas">
            <a href="#products" className="btn-primary">Shop the Drop</a>
            <Link
              to="/sales"
              className="btn-ghost"
              onMouseEnter={() => prefetchSalesProducts(queryClient)}
              onFocus={() => prefetchSalesProducts(queryClient)}
              onPointerDown={() => prefetchSalesProducts(queryClient)}
            >
              View Sales
            </Link>
          </div>
        </div>

        <div className="hero-bg-text">RAW</div>
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-num">500+</div>
            <div className="stat-label">Designs</div>
          </div>
          <div className="stat">
            <div className="stat-num">12K</div>
            <div className="stat-label">Orders</div>
          </div>
          <div className="stat">
            <div className="stat-num">4.9★</div>
            <div className="stat-label">Rating</div>
          </div>
        </div>
      </section>

      <div className="marquee-bar">
        <div className="marquee-inner">
          {Array.from({ length: 3 }).map((_, index) => (
            <span key={index}>FREE DELIVERY ISLAND-WIDE&nbsp;&nbsp;&nbsp; PREMIUM QUALITY&nbsp;&nbsp;&nbsp; NEW DROP EVERY FRIDAY&nbsp;&nbsp;&nbsp; OVERSIZED FIT&nbsp;&nbsp;&nbsp; CASH ON DELIVERY&nbsp;&nbsp;&nbsp;</span>
          ))}
        </div>
      </div>

      <section className="products-section" id="products">
        <div className="collection-smoke" aria-hidden="true" />
        <div className="section-header collection-header reveal">
          <div>
            <p className="section-kicker">/ Collection</p>
            <h2 className="section-title collection-title">FEATURED DROPS</h2>
          </div>
          <p className="section-desc">Limited pieces. Maximum impact. Built for those who break the script.</p>
        </div>

        <div className="collection-showcase">
          <div className="collection-stack" aria-label="Featured product stack" ref={stackRef}>
            {featuredLoading && Array.from({ length: 5 }).map((_, index) => (
              <div
                className={`luxury-product-card featured-product-skeleton stack-step-${index}`}
                style={{ '--stack-step': index }}
                key={`featured-skeleton-${index}`}
                aria-hidden="true"
              />
            ))}
            {!featuredLoading && orderedFeaturedProducts
              .map((product, index) => {
                const step = index; // 04(back)=0 ... 01(front)=3
                const label = String(index + 1).padStart(2, '0');
                const isActive = index === 0;

                return (
                  <button
                    type="button"
                    className={`luxury-product-card stack-step-${step} ${isActive ? 'active' : ''}`}
                    data-card-index={index}
                    style={{ '--stack-step': step }}
                    key={product.id || product.name}
                    onClick={() => setActiveProductIndex(product.originalIndex)}
                  >
                    <span className="stack-card-number">{label}</span>
                    <span className="stack-brand">ASTRAVIA</span>
                    <span className="stack-name">{product.name}</span>
                    <span className="stack-price">Rs. {product.price}.00</span>
                    <span className="product-img-wrap" aria-hidden="true">
                      <span className="product-img-glow" />
                      <img
                        src={product.stackImage}
                        alt=""
                        className="stack-product-image"
                        draggable={false}
                        loading={step === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                      <span className="product-img-shadow" />
                    </span>
                  </button>
                );
              })}
          </div>

          {featuredLoading ? (
            <div className="active-product-panel featured-product-empty" ref={panelRef} aria-hidden="true">
              <div className="active-product-visual" />
              <div className="active-product-info">
                <div className="featured-panel-line" />
                <div className="featured-panel-line wide" />
                <div className="featured-panel-line short" />
              </div>
            </div>
          ) : activeProduct ? (
          <motion.div className="active-product-panel" ref={panelRef}>
            <div className="active-product-visual">
              <span className="product-img-glow product-img-glow--panel" aria-hidden="true" />
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeProduct.name}
                  src={activeProduct.featureImage}
                  alt={activeProduct.name}
                  className="panel-product-image"
                  initial={{ opacity: 0, y: -10, scale: 0.88 }}
                  animate={{ opacity: 1, y: -18, scale: 0.9 }}
                  exit={{ opacity: 0, y: -26, scale: 0.88 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  draggable={false}
                />
              </AnimatePresence>
              <span className="product-img-shadow product-img-shadow--panel" aria-hidden="true" />
            </div>

            <div className="active-product-info">
              <div className="product-badge badge-new">{activeProduct.limited || 'Limited Drop'}</div>
              <AnimatePresence mode="wait">
                <motion.div
                  className="active-product-content"
                  key={`${activeProduct.name}-info`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <h3>{activeProduct.name}</h3>
                  <p className="active-product-copy">
                    {activeProduct.description} {activeProduct.sub}
                  </p>

                  <div className="active-product-meta">
                    <div><span>Fabric</span><strong>{activeProduct.fabric}</strong></div>
                    <div><span>Fit</span><strong>{activeProduct.fit}</strong></div>
                    <div><span>Limited</span><strong>{activeProduct.limited}</strong></div>
                  </div>

                  <div className="active-product-price">
                    <span className="currency">Rs. </span>{activeProduct.price}.00
                  </div>

                  <div className="active-size-row">
                    <span>Size</span>
                    <div className="product-sizes">
                      {activeProductSizes.map((size) => (
                        <button
                          type="button"
                          className={`size-dot ${selectedSize === size ? 'selected-size' : ''}`}
                          key={size}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Link className="view-product-btn" to={`/products/${activeProduct.id}`}>
                    <span>VIEW PRODUCT</span>
                    <span aria-hidden="true">-&gt;</span>
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
          ) : (
            <div className="active-product-panel featured-product-empty" ref={panelRef}>
              <div className="active-product-visual" aria-hidden="true">
                <span className="product-img-glow product-img-glow--panel" />
              </div>
              <div className="active-product-info">
                <div className="product-badge badge-new">Featured Drop</div>
                <div className="active-product-content">
                  <h3>Featured drops coming soon</h3>
                  <p className="active-product-copy">Fresh Astravia pieces are being prepared for this space.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {featuredProducts.length > 0 && (
        <div className="collection-controls">
          <button type="button" onClick={() => setActiveProductIndex((index) => Math.max(0, index - 1))} aria-label="Previous product">
            &lt;
          </button>
          <button type="button" onClick={() => setActiveProductIndex((index) => Math.min(featuredProducts.length - 1, index + 1))} aria-label="Next product">
            &gt;
          </button>
          <span>Scroll to explore</span>
        </div>
        )}

        <div className="collection-service-row">
          {[
            ['Worldwide Shipping', 'Fast and secure delivery', FiTruck],
            ['Premium Quality', 'Built to last. Worn worldwide.', FiShield],
            ['Easy Returns', '14-day return & exchange', FiRefreshCw],
            ['Secure Payments', '100% safe & encrypted', FiLock],
          ].map(([title, text, Icon]) => (
            <div className="service-item" key={title}>
              <span className="service-icon" aria-hidden="true">
                <Icon />
              </span>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="virtual-tryon-section drop-lab-section" id="drop-lab">
        <div className="tryon-copy tryon-animate">
          <p className="tryon-kicker">Live Styling Engine</p>
          <h2 className="tryon-title">DROP<br />LAB<br /><span>LIVE.</span></h2>
          <p className="tryon-description">
            Pick a mood and let Astravia build a wearable tee setup with a match score, color palette, styling kit, and instant cart action.
          </p>
          <ul className="tryon-features">
            {['Choose your vibe', 'See the fit formula', 'Add the pick instantly', 'Switch moods anytime'].map((item) => (
              <li key={item}><FiCheck aria-hidden="true" />{item}</li>
            ))}
          </ul>
        </div>

        <div className="drop-lab-console tryon-animate">
          <div className="drop-lab-tabs" role="tablist" aria-label="Drop Lab modes">
            {dropLabModes.map((mode, index) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeDropLabIndex === index}
                className={activeDropLabIndex === index ? 'active' : ''}
                key={mode.id}
                onClick={() => setActiveDropLabIndex(index)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {mode.label}
              </button>
            ))}
          </div>

          <div className="drop-lab-stage">
            <div className="drop-lab-orbit" aria-hidden="true">
              {activeDropLabMode.palette.map((color, index) => (
                <span key={color} style={{ '--swatch': color, '--spin-step': index }} />
              ))}
            </div>
            <div className="drop-lab-product">
              <img src={activeDropLabProduct.image} alt={activeDropLabProduct.name} loading="lazy" decoding="async" />
            </div>
            <div className="drop-lab-scan" aria-hidden="true" />
          </div>

          <div className="drop-lab-kit">
            {activeDropLabMode.kit.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <aside className="drop-lab-result tryon-animate">
          <p className="drop-finder-label">Current Formula</p>
          <h3>{activeDropLabProduct.name}</h3>
          <p>{activeDropLabMode.headline}</p>
          <div className="tryon-product-price">Rs. {activeDropLabProduct.price}.00</div>
          <p className="drop-lab-brief">{activeDropLabMode.brief}</p>
          <div className="drop-lab-palette" aria-label="Recommended palette">
            {activeDropLabMode.palette.map((color) => (
              <span key={color} style={{ background: color }} />
            ))}
          </div>
          <div className="locker-progress-list drop-lab-score-list">
            {activeDropLabMode.stats.map(([label, value]) => (
              <div className="locker-progress" key={label}>
                <div><span>{label}</span><strong>{value}%</strong></div>
                <i style={{ '--value': `${value}%` }} />
              </div>
            ))}
          </div>
          <button type="button" className="tryon-cart-btn drop-lab-cart" onClick={handleDropLabAddToCart}>
            Add Lab Pick To Bag
          </button>
          <Link className="drop-lab-secondary-link" to={`/products/${activeDropLabProduct.id}`}>
            Inspect product
          </Link>
        </aside>
      </section>

      <section className="newsletter reveal">
        <div>
          <h2 className="newsletter-title">GET FIRST<br />ACCESS TO<br />EVERY DROP</h2>
          <p className="newsletter-desc">Join 8,000+ subscribers. New tees, exclusive deals, early access - straight to your inbox.</p>
        </div>
        <div>
          <div className="newsletter-form">
            <input
              type="email"
              className="newsletter-input"
              placeholder="your@email.com"
              id="nlEmail"
              value={newsletterEmail}
              onChange={(event) => setNewsletterEmail(event.target.value)}
            />
            <button className="newsletter-btn" onClick={subscribe}>Subscribe</button>
          </div>
          <p className="newsletter-note">No spam. Unsubscribe anytime. We only email when it matters.</p>
          {newsletterMessage && <div className="newsletter-success">✓ YOU'RE IN. FIRST DROP ALERT INCOMING.</div>}
        </div>
      </section>

      {false && (
      <footer>
        <div className="footer-top">
          <div>
            <div className="footer-logo">RAW<span>K</span>ODE</div>
            <p className="footer-about">Premium men's graphic tees made in Sri Lanka. Raw aesthetics. Unfiltered style. Built for those who wear their attitude.</p>
            <div className="social-links">
              {['IG', 'FB', 'TK', 'WA'].map((item) => <a href="#" className="social-link" key={item}>{item}</a>)}
            </div>
          </div>
          {[
            ['Shop', ['New Arrivals', 'Graphic Tees', 'Oversized', 'Limited Edition', 'Sale']],
            ['Help', ['Size Guide', 'Track Order', 'Returns', 'FAQ', 'Contact Us']],
            ['Info', ['About Us', 'Our Story', 'Sustainability', 'Privacy Policy', 'Terms']],
          ].map(([title, links]) => (
            <div key={title}>
              <div className="footer-col-title">{title}</div>
              <ul className="footer-links">
                {links.map((link) => <li key={link}><a href="#">{link}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© 2026 RAWKODE. Made in Sri Lanka</span>
          <span>Visa · Mastercard · Cash on Delivery · Bank Transfer</span>
        </div>
      </footer>
      )}
    </>
  );
}

