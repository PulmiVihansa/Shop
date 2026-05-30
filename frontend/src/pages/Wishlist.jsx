import { useMemo, useRef, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';

const initialItems = [
  {
    id: 1,
    category: 'women',
    name: 'Structured Linen Blazer',
    label: 'Linen Blazer',
    price: 385,
    badge: 'new',
    saved: 'Saved 2 days ago',
    sizes: ['XS', 'S', 'M'],
    selectedSize: 'S',
    imageClass: 'linen',
  },
  {
    id: 2,
    category: 'women',
    name: 'Flowing Silk Midi',
    label: 'Silk Midi',
    price: 382,
    originalPrice: 450,
    savings: 68,
    badge: 'sale',
    saved: 'Saved 5 days ago',
    sizes: ['XS', 'S', 'M', 'L'],
    selectedSize: 'S',
    imageClass: 'silk',
  },
  {
    id: 3,
    category: 'men',
    name: 'Relaxed Cotton Shirt',
    label: 'Cotton Shirt',
    price: 195,
    saved: 'Saved 1 week ago',
    sizes: ['S', 'M', 'L', 'XL'],
    selectedSize: 'M',
    imageClass: 'cotton',
  },
  {
    id: 4,
    category: 'men',
    name: 'Merino Wool Overcoat',
    label: 'Wool Coat',
    price: 620,
    badge: 'low',
    saved: 'Saved 2 weeks ago',
    sizes: ['M', 'L', 'XL'],
    selectedSize: 'M',
    imageClass: 'wool',
  },
  {
    id: 5,
    category: 'women',
    name: 'Velvet Wide Trousers',
    label: 'Velvet Trouser',
    price: 295,
    badge: 'new',
    saved: 'Saved 3 days ago',
    sizes: ['XS', 'S', 'M'],
    selectedSize: 'S',
    imageClass: 'velvet',
  },
  {
    id: 6,
    category: 'accessories',
    name: 'Washed Canvas Tote',
    label: 'Canvas Tote',
    price: 145,
    saved: 'Saved 4 days ago',
    sizes: ['One Size'],
    selectedSize: 'One Size',
    imageClass: 'denim',
  },
];

const formatCurrency = (value) => `LKR${value.toLocaleString()}`;

export default function Wishlist() {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('saved');
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const { addItem, addItems, openCart } = useCart();

  const showToast = (message) => {
    setToast(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(''), 2800);
  };

  const visibleItems = useMemo(() => {
    const filtered = filter === 'all' ? items : items.filter((item) => item.category === filter);
    const sorted = [...filtered];
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'saved') sorted.sort((a, b) => a.id - b.id);
    return sorted;
  }, [items, filter, sort]);

  const total = visibleItems.reduce((sum, item) => sum + item.price, 0);
  const savings = visibleItems.reduce((sum, item) => sum + (item.savings || 0), 0);

  const handleRemove = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    showToast('Item removed from wishlist');
  };

  const handleMoveToBag = (item) => {
    addItem({
      productId: item.id,
      name: item.name,
      image: item.image || '',
      price: item.price,
      size: item.selectedSize,
      quantity: 1,
    });
    setItems((prev) => prev.filter((entry) => entry.id !== item.id));
    showToast(`${item.name} added to bag — ${formatCurrency(item.price)}`);
    openCart();
  };

  const handleMoveAll = () => {
    if (!visibleItems.length) return;
    addItems(
      visibleItems.map((item) => ({
        productId: item.id,
        name: item.name,
        image: item.image || '',
        price: item.price,
        size: item.selectedSize,
        quantity: 1,
      }))
    );
    setItems((prev) => prev.filter((item) => !visibleItems.some((entry) => entry.id === item.id)));
    showToast(`${visibleItems.length} pieces moved to your bag`);
    openCart();
  };

  const handleSizeSelect = (id, size) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selectedSize: size } : item))
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Archivo:wght@300;400;500;600&display=swap');

        :root {
          --cream: #faf7f2;
          --charcoal: #1a1a1a;
          --Ash: #8f9390;
          --sage: #a8b5a0;
          --stone: #d4cdc5;
          --stone-lt: #eae6e0;
          --ink: rgba(26, 26, 26, 0.55);
        }

        .wishlist-page {
          font-family: 'Archivo', sans-serif;
          background: var(--cream);
          color: var(--charcoal);
          min-height: 100vh;
          overflow-x: hidden;
        }

        .wishlist-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.025;
          pointer-events: none;
          z-index: 1;
        }

        .wishlist-page > * {
          position: relative;
          z-index: 2;
        }

        .page-header {
          padding: 10rem 4rem 0;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: flex-end;
          gap: 2rem;
          border-bottom: 1px solid var(--stone);
          padding-bottom: 2.5rem;
        }

        .header-eyebrow {
          font-size: 0.7rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--Ash);
          font-weight: 600;
          margin-bottom: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .header-eyebrow::before {
          content: '';
          display: inline-block;
          width: 24px;
          height: 1px;
          background: var(--Ash);
        }

        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 5.5rem;
          font-weight: 300;
          line-height: 0.92;
          letter-spacing: -0.02em;
          color: var(--charcoal);
        }

        .page-title em {
          font-style: italic;
          color: var(--Ash);
        }

        .header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
          padding-bottom: 0.5rem;
        }

        .item-count {
          font-family: 'Cormorant Garamond', serif;
          font-size: 4rem;
          font-weight: 300;
          line-height: 1;
          color: var(--stone);
          letter-spacing: -0.03em;
          transition: color 0.4s ease;
        }

        .item-count.has-items {
          color: var(--charcoal);
        }

        .item-label {
          font-size: 0.7rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink);
        }

        .filters-bar {
          padding: 1.8rem 4rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--stone-lt);
        }

        .filter-tabs {
          display: flex;
          gap: 0;
        }

        .filter-tab {
          padding: 0.6rem 1.6rem;
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid var(--stone);
          border-right: none;
          background: transparent;
          color: var(--ink);
          transition: all 0.25s ease;
          font-family: 'Archivo', sans-serif;
        }

        .filter-tab:last-child {
          border-right: 1px solid var(--stone);
        }

        .filter-tab:hover {
          background: var(--stone-lt);
          color: var(--charcoal);
        }

        .filter-tab.active {
          background: var(--charcoal);
          color: var(--cream);
          border-color: var(--charcoal);
        }

        .sort-select {
          font-family: 'Archivo', sans-serif;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--charcoal);
          background: transparent;
          border: 1px solid var(--stone);
          padding: 0.6rem 1.2rem;
          cursor: pointer;
          outline: none;
          appearance: none;
          padding-right: 2.4rem;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%231A1A1A' stroke-width='1.2' fill='none'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.8rem center;
        }

        .wishlist-body {
          padding: 3rem 4rem 6rem;
        }

        .wishlist-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 4rem;
          align-items: start;
        }

        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
        }

        .wish-card {
          position: relative;
          background: var(--cream);
          border: 1px solid var(--stone-lt);
          overflow: hidden;
          animation: cardIn 0.6s ease-out both;
        }

        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .card-image {
          width: 100%;
          aspect-ratio: 3/4;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-image-bg {
          position: absolute;
          inset: 0;
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .wish-card:hover .card-image-bg {
          transform: scale(1.04);
        }

        .card-image-label {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          color: rgba(26, 26, 26, 0.25);
          position: relative;
          z-index: 1;
          letter-spacing: 0.1em;
        }

        .card-image-bg.linen { background: linear-gradient(160deg, #c8b8ab 0%, #ddd2c8 100%); }
        .card-image-bg.silk { background: linear-gradient(160deg, #b5c0b8 0%, #c8d5c2 100%); }
        .card-image-bg.wool { background: linear-gradient(160deg, #c4a882 0%, #dbc9ae 100%); }
        .card-image-bg.cotton { background: linear-gradient(160deg, #a9b8c0 0%, #c2d0d8 100%); }
        .card-image-bg.velvet { background: linear-gradient(160deg, #9e8fa8 0%, #b5a8c0 100%); }
        .card-image-bg.denim { background: linear-gradient(160deg, #7a8fa0 0%, #9aaabb 100%); }

        .card-overlay {
          position: absolute;
          inset: 0;
          background: rgba(26, 26, 26, 0);
          transition: background 0.4s ease;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding: 1.8rem;
          gap: 0.8rem;
        }

        .wish-card:hover .card-overlay {
          background: rgba(26, 26, 26, 0.18);
        }

        .overlay-btn {
          width: 100%;
          padding: 0.9rem;
          font-family: 'Archivo', sans-serif;
          font-size: 0.75rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transform: translateY(12px);
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .wish-card:hover .overlay-btn {
          transform: translateY(0);
          opacity: 1;
        }

        .overlay-btn.primary {
          background: var(--charcoal);
          color: var(--cream);
        }

        .overlay-btn.secondary {
          background: var(--cream);
          color: var(--charcoal);
          transition-delay: 0.05s;
        }

        .overlay-btn.primary:hover { background: var(--Ash); }
        .overlay-btn.secondary:hover { background: var(--stone-lt); }

        .card-badge {
          position: absolute;
          top: 1.2rem;
          left: 1.2rem;
          z-index: 5;
          font-size: 0.62rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 600;
          padding: 0.3rem 0.7rem;
        }

        .card-badge.new { background: var(--Ash); color: var(--cream); }
        .card-badge.sale { background: var(--charcoal); color: var(--cream); }
        .card-badge.low { background: var(--stone); color: var(--charcoal); }

        .card-remove {
          position: absolute;
          top: 1.2rem;
          right: 1.2rem;
          z-index: 10;
          width: 32px;
          height: 32px;
          background: var(--cream);
          border: 1px solid var(--stone);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
          opacity: 0;
        }

        .wish-card:hover .card-remove { opacity: 1; }
        .card-remove:hover { background: var(--charcoal); border-color: var(--charcoal); }
        .card-remove:hover svg { stroke: var(--cream); }
        .card-remove svg { width: 14px; height: 14px; stroke: var(--charcoal); fill: none; stroke-width: 1.8; transition: stroke 0.25s; }

        .card-info {
          padding: 1.4rem 1.6rem 1.8rem;
          border-top: 1px solid var(--stone-lt);
        }

        .card-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .card-category {
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--Ash);
          font-weight: 600;
        }

        .card-saved {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          color: var(--ink);
        }

        .card-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.45rem;
          font-weight: 400;
          color: var(--charcoal);
          line-height: 1.2;
          margin-bottom: 0.8rem;
          letter-spacing: -0.01em;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-price-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .card-price {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.3rem;
          font-weight: 400;
          color: var(--charcoal);
        }

        .card-price.has-sale { color: var(--Ash); }

        .card-price-original {
          font-size: 0.78rem;
          color: var(--ink);
          text-decoration: line-through;
        }

        .card-sizes {
          display: flex;
          gap: 0.4rem;
        }

        .size-dot {
          width: 26px;
          height: 26px;
          border: 1px solid var(--stone);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
          letter-spacing: 0.05em;
          color: var(--ink);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .size-dot:hover,
        .size-dot.selected {
          background: var(--charcoal);
          border-color: var(--charcoal);
          color: var(--cream);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          text-align: center;
          padding: 4rem;
          gap: 2rem;
        }

        .empty-icon {
          width: 72px;
          height: 72px;
          opacity: 0.2;
        }

        .empty-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.8rem;
          font-weight: 300;
          color: var(--charcoal);
        }

        .empty-sub {
          font-size: 0.88rem;
          line-height: 1.7;
          color: var(--ink);
          max-width: 380px;
        }

        .empty-cta {
          display: inline-block;
          padding: 1rem 2.8rem;
          background: var(--charcoal);
          color: var(--cream);
          text-decoration: none;
          font-size: 0.78rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 500;
          transition: background 0.3s ease;
        }

        .empty-cta:hover { background: var(--Ash); }

        .summary-panel {
          position: sticky;
          top: 6rem;
          border: 1px solid var(--stone);
          padding: 2.5rem;
          background: var(--cream);
        }

        .summary-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-weight: 400;
          margin-bottom: 2rem;
          padding-bottom: 1.2rem;
          border-bottom: 1px solid var(--stone);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.9rem 0;
          border-bottom: 1px solid var(--stone-lt);
          font-size: 0.82rem;
        }

        .summary-row-label { color: var(--ink); letter-spacing: 0.06em; }

        .summary-row-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          font-weight: 400;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin: 1.8rem 0;
        }

        .summary-total-label {
          font-size: 0.7rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink);
        }

        .summary-total-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.2rem;
          font-weight: 300;
        }

        .summary-cta {
          width: 100%;
          padding: 1.1rem;
          background: var(--charcoal);
          color: var(--cream);
          font-family: 'Archivo', sans-serif;
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: background 0.3s ease;
          margin-bottom: 0.8rem;
        }

        .summary-cta:hover { background: var(--Ash); }

        .summary-cta.outline {
          background: transparent;
          border: 1px solid var(--stone);
          color: var(--charcoal);
        }

        .summary-cta.outline:hover {
          background: var(--stone-lt);
        }

        .summary-note {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--stone-lt);
          font-size: 0.75rem;
          line-height: 1.65;
          color: var(--ink);
        }

        .summary-note strong { color: var(--charcoal); }

        .toast {
          position: fixed;
          bottom: 2.5rem;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: var(--charcoal);
          color: var(--cream);
          padding: 0.9rem 2rem;
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          opacity: 0;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          z-index: 500;
          white-space: nowrap;
        }

        .toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        @media (max-width: 1100px) {
          .wishlist-layout { grid-template-columns: 1fr; }
          .summary-panel { position: static; }
          .wishlist-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 720px) {
          .page-header { padding: 7rem 1.6rem 2rem; grid-template-columns: 1fr; }
          .page-title { font-size: 3.5rem; }
          .header-right { align-items: flex-start; margin-top: 1rem; }
          .filters-bar { padding: 1.2rem 1.6rem; flex-direction: column; gap: 1rem; align-items: flex-start; }
          .wishlist-body { padding: 2rem 1.6rem 4rem; }
          .wishlist-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="wishlist-page">
        <header className="page-header">
          <div className="header-left">
            <div className="header-eyebrow">Curated by you</div>
            <h1 className="page-title">
              My <em>Wishlist</em>
            </h1>
          </div>
          <div className="header-right">
            <div className={`item-count ${items.length ? 'has-items' : ''}`}>{items.length}</div>
            <div className="item-label">pieces saved</div>
          </div>
        </header>

        <div className="filters-bar">
          <div className="filter-tabs">
            {['all', 'women', 'men', 'accessories'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`filter-tab ${filter === tab ? 'active' : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <select className="sort-select" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="saved">Recently Saved</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        <main className="wishlist-body">
          <div className="wishlist-layout">
            <div>
              {items.length === 0 ? (
                <div className="empty-state">
                  <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                  <h2 className="empty-title">Your wishlist is empty</h2>
                  <p className="empty-sub">
                    You haven&apos;t saved any pieces yet. Browse our collection and tap the heart to save pieces you love.
                  </p>
                  <a href="/#collections" className="empty-cta">Explore Collection</a>
                </div>
              ) : (
                <div className="wishlist-grid">
                  {visibleItems.map((item, index) => (
                    <div key={item.id} className="wish-card" style={{ animationDelay: `${index * 0.08}s` }}>
                      {item.badge && <div className={`card-badge ${item.badge}`}>{item.badge === 'low' ? '2 Left' : item.badge}</div>}
                      <button className="card-remove" type="button" onClick={() => handleRemove(item.id)} title="Remove">
                        <svg viewBox="0 0 24 24">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                      <div className="card-image">
                        <div className={`card-image-bg ${item.imageClass}`} />
                        <span className="card-image-label">{item.label}</span>
                        <div className="card-overlay">
                          <button className="overlay-btn primary" type="button" onClick={() => handleMoveToBag(item)}>
                            Move to Bag
                          </button>
                          <button className="overlay-btn secondary" type="button">Quick View</button>
                        </div>
                      </div>
                      <div className="card-info">
                        <div className="card-meta">
                          <span className="card-category">{item.category}</span>
                          <span className="card-saved">{item.saved}</span>
                        </div>
                        <div className="card-name">{item.name}</div>
                        <div className="card-footer">
                          <div className="card-price-wrap">
                            <span className={`card-price ${item.originalPrice ? 'has-sale' : ''}`}>{formatCurrency(item.price)}</span>
                            {item.originalPrice && (
                              <span className="card-price-original">{formatCurrency(item.originalPrice)}</span>
                            )}
                          </div>
                          <div className="card-sizes">
                            {item.sizes.map((size) => (
                              <button
                                key={size}
                                type="button"
                                className={`size-dot ${item.selectedSize === size ? 'selected' : ''}`}
                                onClick={() => handleSizeSelect(item.id, size)}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <aside className="summary-panel">
                <div className="summary-title">Summary</div>
                <div className="summary-row">
                  <span className="summary-row-label">Pieces saved</span>
                  <span className="summary-row-val">{visibleItems.length}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-row-label">Estimated total</span>
                  <span className="summary-row-val">{formatCurrency(total + savings)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-row-label">Sale savings</span>
                  <span className="summary-row-val" style={{ color: 'var(--Ash)' }}>
                    {savings > 0 ? `−${formatCurrency(savings)}` : 'LKR0'}
                  </span>
                </div>

                <div className="summary-total">
                  <span className="summary-total-label">Combined Value</span>
                  <span className="summary-total-val">{formatCurrency(total)}</span>
                </div>

                <button className="summary-cta" type="button" onClick={handleMoveAll}>
                  Move All to Bag
                </button>
                <button className="summary-cta outline" type="button" onClick={() => showToast('Wishlist link copied')}>
                  Share Wishlist
                </button>

                <p className="summary-note">
                  <strong>Free delivery</strong> on all orders over LKR250. Sizes selected above are indicative — confirm in
                  bag before checkout.
                  <br />
                  <br />
                  Items are not reserved until in your bag.
                </p>
              </aside>
            )}
          </div>
        </main>

        <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
      </div>
    </>
  );
}
