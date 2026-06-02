import { useEffect, useMemo, useRef, useState } from 'react';
import { FiCheck, FiLock, FiRefreshCw, FiShield, FiTruck, FiUpload } from 'react-icons/fi';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import LightPillar from '../components/home/LightPillar.jsx';
import TShirtExperience from '../components/home/TShirtExperience.jsx';
import IntroVideoGate from '../components/home/IntroVideoGate.jsx';
import { useCart } from '../context/CartContext.jsx';
import { compressTryOnImage, generateVirtualTryOn } from '../services/aiTryOn.js';
import '../styles/home.css';

gsap.registerPlugin(ScrollTrigger);

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
    name: 'Olive Cargo Tee',
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

const aiResponses = {
  default: [
    "Based on your vibe, I'd go with the Break Rules Tee - black, bold graphic, oversized. That's the one.",
    'That is giving Blood Script Tee energy - limited edition, red print, makes a statement without saying a word.',
    'The Phantom Navy Tee is calling your name. Heavyweight fabric, clean drop, works for anything.',
    'Honestly? The Ghost Type Tee - cream on black, subtle flex, versatile enough for any occasion.',
  ],
  night: 'Night out? Break Rules Tee or Blood Script Tee. Pair with black cargo pants and chunky sneakers. That fit is locked.',
  casual: 'Casual day? Ghost Type Tee in cream - pair it with olive joggers and clean white shoes. Effortless but intentional.',
  statement: "Blood Script Tee. Limited run, red print on black. One piece, whole outfit. That's your statement.",
  minimal: 'Ghost Type Tee - cream white, subtle typography, premium GSM. Clean, minimal, confident. No need for anything loud.',
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
  const { addItem, openCart } = useCart();
  const [introComplete, setIntroComplete] = useState(false);
  const [cartCount, setCartCount] = useState(2);
  const [filter, setFilter] = useState('all');
  const [activeProductIndex, setActiveProductIndex] = useState(0);
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
  const [dropFinder, setDropFinder] = useState({ chest: '', height: '', fit: 'oversized', vibe: 'statement' });
  const tryOnInputRef = useRef(null);

  const visibleProducts = useMemo(() => {
    if (filter === 'all') return products;
    return products.filter((product) => product.cat.includes(filter));
  }, [filter]);

  const featuredProducts = useMemo(
    () => [
      { ...products[5], id: 'ghost-type-tee', number: 6, name: 'Ghost Type Tee', stackImage: '/models/Tshirt22.png', featureImage: '/models/Tshirt22.png', description: 'Collector-weight graphic tee with a clean oversized streetwear silhouette.', fabric: '280 GSM Fabric', fit: 'Oversized Fit', limited: 'Collector Drop', price: '5,500' },
      { ...products[4], id: 'shadow-box-tee', number: 5, name: 'Shadow Box Tee', stackImage: '/models/Tshirt11.png', featureImage: '/models/Tshirt11.png', description: 'Minimal black graphic tee with a premium matte finish and relaxed drape.', fabric: '280 GSM Fabric', fit: 'Oversized Fit', limited: 'Limited Edition', price: '3,600' },
      { ...products[3], id: 'chaos-tee', number: 4, name: 'Chaos Tee', stackImage: '/models/Tshirt8.png', featureImage: '/models/Tshirt44.png', description: 'A loud red-on-black graphic piece with a clean premium drape.', fabric: '280 GSM Fabric', fit: 'Oversized Fit', limited: 'Limited Edition', price: '4,990' },
      { ...products[2], id: 'shadow-tee', number: 3, name: 'Shadow Tee', stackImage: '/models/Tshirt7.png', featureImage: '/models/Tshirt33.png', description: 'A deep black oversized cut with red artwork and collector-level presence.', fabric: '280 GSM Fabric', fit: 'Oversized Fit', limited: 'Limited Edition', price: '4,690' },
      { ...products[1], id: 'void-tee', number: 2, name: 'Void Tee', stackImage: '/models/Tshirt6.png', featureImage: '/models/Tshirt11.png', description: 'Dark graphic tee with a sharp campaign silhouette and premium streetwear weight.', fabric: '280 GSM Fabric', fit: 'Oversized Fit', limited: 'Limited Edition', price: '4,490' },
      { ...products[0], id: 'break-rules-tee', number: 1, name: 'Break Rules Tee', stackImage: '/models/Tshirt5.png', featureImage: '/models/Tshirt22.png', description: 'Premium oversized tee crafted from heavy-weight 280GSM cotton. Built to stand out.', fabric: '280 GSM Fabric', fit: 'Oversized Fit', limited: 'Limited Edition', price: '5,290' },
    ],
    [],
  );
  const activeProduct = featuredProducts[activeProductIndex % Math.max(1, featuredProducts.length)] || products[0];

  const stackRef = useRef(null);
  const panelRef = useRef(null);
  const selectedTryOnProduct = tryOnProducts[tryOnProductIndex] || tryOnProducts[0];
  const dropFinderResult = useMemo(() => {
    const chest = Number(dropFinder.chest);
    const baseSize = chest && chest < 88 ? 'S' : chest && chest < 98 ? 'M' : chest && chest < 108 ? 'L' : chest && chest < 118 ? 'XL' : 'XXL';
    const sizeOrder = ['S', 'M', 'L', 'XL', 'XXL'];
    const baseIndex = sizeOrder.indexOf(baseSize);
    const fitOffset = dropFinder.fit === 'clean' ? -1 : dropFinder.fit === 'boxy' ? 1 : 0;
    const recommendedSize = sizeOrder[Math.max(0, Math.min(sizeOrder.length - 1, baseIndex + fitOffset))] || 'M';
    const selectedProduct = tryOnProducts[tryOnProductIndex];
    const product =
      selectedProduct?.vibe === dropFinder.vibe
        ? selectedProduct
        : tryOnProducts.find((item) => item.vibe === dropFinder.vibe) || selectedProduct || tryOnProducts[0];

    const fitCopy = {
      clean: 'Cleaner shoulder line with less drape.',
      oversized: 'Astravia signature oversized streetwear fit.',
      boxy: 'More volume through chest and sleeve.',
    };

    return {
      product,
      size: recommendedSize,
      fitNote: fitCopy[dropFinder.fit],
      styling: dropFinder.vibe === 'statement'
        ? 'Pair with black cargos, silver accessories, and heavy sneakers.'
        : dropFinder.vibe === 'night'
          ? 'Style with washed denim, black boots, and a cropped outer layer.'
          : dropFinder.vibe === 'daily'
            ? 'Wear with relaxed trousers and clean white or black sneakers.'
            : 'Keep it sharp with monochrome pants and minimal accessories.',
    };
  }, [dropFinder, tryOnProductIndex]);

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

  const addToCart = (name) => {
    setCartCount((count) => count + 1);
    setAddedProduct(name);
    window.setTimeout(() => setAddedProduct(''), 2000);
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
      {!introComplete && <IntroVideoGate onFinish={() => setIntroComplete(true)} />}

      <section className="hero">
        <div className="hero-light-pillar-background" aria-hidden="true">
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
        </div>
        <div className="hero-3d-layer" aria-hidden="true">
          {introComplete && <TShirtExperience className="hero-canvas" />}
        </div>

        <div className="hero-left">
          <p className="hero-eyebrow">New Drop - SS 2026</p>
          <h1 className="hero-title">BREAK<br /><em>RULES</em><br />NOT STYLE</h1>
          <p className="hero-sub">Premium oversized tees built for men who don't follow the script. Crafted in Sri Lanka. Worn everywhere.</p>
          <div className="hero-ctas">
            <a href="#products" className="btn-primary">Shop the Drop</a>
            <a href="/sales" className="btn-ghost">View Sales</a>
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
            {featuredProducts
              .map((product, index) => {
                const number = product.number;
                const step = index; // 04(back)=0 ... 01(front)=3
                const label = String(number).padStart(2, '0');
                const isActive = index === activeProductIndex;
                const zIndex = isActive ? 50 : 10 + (featuredProducts.length - Math.abs(index - activeProductIndex));

                return (
                  <button
                    type="button"
                    className={`luxury-product-card stack-step-${step} ${isActive ? 'active' : ''}`}
                    data-card-index={index}
                    style={{ zIndex, '--stack-step': step }}
                    key={product.name}
                    onClick={() => setActiveProductIndex(index)}
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
                      />
                      <span className="product-img-shadow" />
                    </span>
                  </button>
                );
              })}
          </div>

          <motion.div className="active-product-panel reveal" ref={panelRef}>
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
                      {(activeProduct.sizes.length ? activeProduct.sizes : ['S', 'M', 'L', 'XL']).map((size) => (
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
        </div>

        <div className="collection-controls">
          <button type="button" onClick={() => setActiveProductIndex((index) => Math.max(0, index - 1))} aria-label="Previous product">
            &lt;
          </button>
          <button type="button" onClick={() => setActiveProductIndex((index) => Math.min(featuredProducts.length - 1, index + 1))} aria-label="Next product">
            &gt;
          </button>
          <span>Scroll to explore</span>
        </div>

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

      <section className="virtual-tryon-section drop-finder-section" id="fit-finder">
        <div className="tryon-copy tryon-animate">
          <p className="tryon-kicker">Fit & Drop Finder</p>
          <h2 className="tryon-title">FIND YOUR<br /><span>ASTRAVIA FIT.</span></h2>
          <p className="tryon-description">
            Get a fast size recommendation, match your style mood, and jump straight into the tee that fits your drop energy.
          </p>
          <ul className="tryon-features">
            {['Size recommendation', 'Drop matching', 'Styling notes', 'Direct product link'].map((item) => (
              <li key={item}><FiCheck aria-hidden="true" />{item}</li>
            ))}
          </ul>
        </div>

        <div className="drop-finder-panel tryon-animate">
          <div className="tryon-card-label">Your Fit Profile</div>
          <div className="drop-finder-form">
            <label>
              Chest
              <input
                type="number"
                value={dropFinder.chest}
                onChange={(event) => setDropFinder((current) => ({ ...current, chest: event.target.value }))}
                placeholder="cm"
              />
            </label>
            <label>
              Height
              <input
                type="number"
                value={dropFinder.height}
                onChange={(event) => setDropFinder((current) => ({ ...current, height: event.target.value }))}
                placeholder="cm"
              />
            </label>
            <label>
              Fit
              <select value={dropFinder.fit} onChange={(event) => setDropFinder((current) => ({ ...current, fit: event.target.value }))}>
                <option value="clean">Clean</option>
                <option value="oversized">Oversized</option>
                <option value="boxy">Extra Boxy</option>
              </select>
            </label>
            <label>
              Vibe
              <select value={dropFinder.vibe} onChange={(event) => setDropFinder((current) => ({ ...current, vibe: event.target.value }))}>
                <option value="statement">Statement</option>
                <option value="night">Night Out</option>
                <option value="daily">Daily Wear</option>
                <option value="minimal">Minimal</option>
              </select>
            </label>
          </div>
        </div>

        <aside className="tryon-product-panel drop-finder-result tryon-animate">
          <div className="tryon-product-image">
            <img src={dropFinderResult.product.image} alt={dropFinderResult.product.name} />
          </div>
          <p className="drop-finder-label">Recommended Drop</p>
          <h3>{dropFinderResult.product.name}</h3>
          <div className="drop-finder-size">Size {dropFinderResult.size}</div>
          <p>{dropFinderResult.fitNote}</p>
          <p>{dropFinderResult.styling}</p>
          <div className="tryon-product-price">Rs. {dropFinderResult.product.price}.00</div>
          <Link className="tryon-cart-btn drop-finder-link" to={`/products/${dropFinderResult.product.id}`}>
            View Product
          </Link>
        </aside>

        <div className="tryon-carousel tryon-animate">
          <h3>Pick A Different Drop</h3>
          <div className="tryon-product-grid">
            {tryOnProducts.map((product, index) => (
              <button
                type="button"
                className={`tryon-product-card ${dropFinderResult.product.id === product.id ? 'active' : ''}`}
                key={product.name}
                onClick={() => {
                  setTryOnProductIndex(index);
                  setDropFinder((current) => ({ ...current, vibe: product.vibe }));
                }}
              >
                <img src={product.image} alt={product.name} />
                <span>{product.name}</span>
                <strong>Rs. {product.price}.00</strong>
              </button>
            ))}
          </div>
        </div>
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
