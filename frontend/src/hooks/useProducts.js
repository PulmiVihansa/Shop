import { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

const normalize = (product) => ({
  ...product,
  id: product.id || product._id,
  name: product.name || product.title,
  title: product.title || product.name,
  sizes: product.sizes || [],
  swatches: product.swatches?.length ? product.swatches : ['#C8BAB0'],
  bgClass: product.bgClass || 'b1',
  imageClass: product.imageClass || 'linen',
  categoryLabel: product.categoryLabel || product.category || 'Atelier',
});

export default function useProducts({ fallback = [], category, tag, query, placement } = {}) {
  const [products, setProducts] = useState(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/products', {
          params: {
            category,
            tag,
            placement: placement || undefined,
            q: query || undefined,
          },
        });
        if (active && response.data?.length) {
          setProducts(response.data.map(normalize));
        }
      } catch (err) {
        if (active) {
          setError(err?.response?.data?.message || 'Unable to load products');
          setProducts(fallback);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [category, tag, query, placement]);

  return useMemo(() => ({ products, loading, error }), [products, loading, error]);
}
