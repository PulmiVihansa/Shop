import { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

const EMPTY_FALLBACK = [];

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

const normalize = (product) => {
  const { tags, badge, badgeText, backgroundClass, bgClass, imageClass, ...safeProduct } = product;

  return {
    ...safeProduct,
    id: product.id || product._id,
    name: product.name || product.title,
    title: product.title || product.name,
    collection: 'men',
    category: product.category || '',
    colors: toList(product.colors || product.swatches || product.colours),
    swatches: toList(product.colors || product.swatches || product.colours),
    sizes: toList(product.sizes),
    images: toList(product.images),
    categoryLabel: product.categoryLabel || product.category || 'Atelier',
  };
};

export default function useProducts({ fallback = EMPTY_FALLBACK, collection = 'men', category, query } = {}) {
  const fallbackProducts = useMemo(() => fallback.map(normalize), [fallback]);
  const [products, setProducts] = useState(fallbackProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError('');
      try {
        const params = {
          collection,
          category,
          q: query || undefined,
        };
        const response = await api.get('/products', {
          params,
        });
        if (active) {
          const nextProducts = Array.isArray(response.data) ? response.data.map(normalize) : [];
          if (import.meta.env.DEV) {
            console.debug('[useProducts] response', {
              params,
              count: nextProducts.length,
              sample: nextProducts[0]
                ? {
                    id: nextProducts[0].id,
                    collection: nextProducts[0].collection,
                    category: nextProducts[0].category,
                  }
                : null,
            });
          }
          setProducts(nextProducts);
        }
      } catch (err) {
        if (active) {
          setError(err?.response?.data?.message || 'Unable to load products');
          setProducts(fallbackProducts);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [collection, category, fallbackProducts, query]);

  return useMemo(() => ({ products, loading, error }), [products, loading, error]);
}
