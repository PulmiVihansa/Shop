import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import api from '../services/api.js';
import { createCartItem, getProductSizes } from '../utils/cartProduct.js';

const toList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export default function ProductDetails() {
  const { id } = useParams();
  const { addItem, openCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [bagMessage, setBagMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/products/${id}`);
        if (active) {
          setProduct(response.data || null);
          setSelectedSize('');
          setBagMessage('');
        }
      } catch (err) {
        if (active) {
          setError(err?.response?.data?.message || err.message || 'Unable to load product');
          setProduct(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [id]);

  const colors = useMemo(() => toList(product?.colors || product?.swatches || product?.colours), [product]);
  const images = useMemo(() => toList(product?.images), [product]);
  const purchasableSizes = useMemo(() => getProductSizes(product), [product]);

  const handleAddToBag = () => {
    if (!product) return;
    if (!selectedSize) {
      setBagMessage('Please select a size');
      return;
    }

    addItem(createCartItem({ ...product, images }, selectedSize));
    setBagMessage(`Added ${product.name} - ${selectedSize}`);
    openCart();
  };

  return (
    <section className="page product-details">
      <div style={{ padding: '2rem 1rem', maxWidth: '1100px', margin: '0 auto' }}>
        <p><Link to="/search">Back to search</Link></p>
        {loading && <p>Loading product...</p>}
        {!loading && error && <p>{error}</p>}
        {!loading && product && (
          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, .8fr)' }}>
            <div style={{ minHeight: '420px', borderRadius: '24px', background: '#f5f0ea', padding: '1.25rem' }}>
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: images.length > 1 ? 'repeat(2, minmax(0, 1fr))' : '1fr' }}>
                {(images.length ? images : ['']).map((src, index) => (
                  <div key={`${src || 'placeholder'}-${index}`} style={{ minHeight: '180px', borderRadius: '20px', background: '#e8e1d8', overflow: 'hidden' }}>
                    {src ? <img src={src} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gap: '.9rem', alignContent: 'start' }}>
              <div>
                <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '.12em', opacity: .7 }}>{product.collection}</p>
                <h1 style={{ margin: '.35rem 0' }}>{product.name}</h1>
                <p style={{ fontSize: '1.2rem', margin: 0 }}>LKR{Number(product.price || 0).toLocaleString()}</p>
              </div>
              <p>{product.description || 'No description available.'}</p>
              <div>
                <strong>Category:</strong> {product.category || 'Uncategorized'}
              </div>
              <div>
                <strong>Subcategory:</strong> {product.subcategory || '—'}
              </div>
              <div>
                <strong>Available Colours:</strong>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
                  {(colors.length ? colors : ['No colours']).map((color) => (
                    <span key={color} style={{ padding: '.4rem .75rem', borderRadius: '999px', background: '#f1ebe4' }}>{color}</span>
                  ))}
                </div>
              </div>
              <div>
                <strong>Sizes:</strong>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
                  {purchasableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size);
                        setBagMessage('');
                      }}
                      style={{
                        padding: '.55rem .85rem',
                        borderRadius: '999px',
                        border: selectedSize === size ? '1px solid #1a1a1a' : '1px solid #d9d0c7',
                        background: selectedSize === size ? '#1a1a1a' : '#f1ebe4',
                        color: selectedSize === size ? '#fff' : '#1a1a1a',
                        cursor: 'pointer',
                        letterSpacing: '.08em',
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div><strong>Stock:</strong> {Number(product.stock || 0)}</div>
              {bagMessage && <p style={{ margin: 0, color: bagMessage === 'Please select a size' ? '#8f3d2f' : '#3f5f42' }}>{bagMessage}</p>}
              <button
                type="button"
                onClick={handleAddToBag}
                style={{
                  border: 0,
                  background: '#1a1a1a',
                  color: '#fff',
                  padding: '.9rem 1.2rem',
                  textTransform: 'uppercase',
                  letterSpacing: '.12em',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Add to Bag
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
