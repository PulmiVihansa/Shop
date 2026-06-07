import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts, productsQueryDefaults } from '../services/productsQueries.js';
import { resolveImageList } from '../utils/imageUrl.js';
import { getAvailableSizes } from '../utils/availableSizes.js';

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
  const sizeStock = product.sizeStock && typeof product.sizeStock === 'object' ? product.sizeStock : {};

  return {
    ...safeProduct,
    id: product.id || product._id,
    name: product.name || product.title,
    title: product.title || product.name,
    collection: 'men',
    category: product.category || '',
    colors: toList(product.colors || product.swatches || product.colours),
    swatches: toList(product.colors || product.swatches || product.colours),
    sizes: getAvailableSizes({ sizes: toList(product.sizes), sizeStock }),
    sizeStock,
    images: resolveImageList(toList(product.images || product.image)),
    image: resolveImageList(toList(product.images || product.image))[0] || '',
    categoryLabel: product.categoryLabel || product.category || 'Astravia',
  };
};

export default function useProducts({ fallback = EMPTY_FALLBACK, collection = 'men', category, query } = {}) {
  const fallbackProducts = useMemo(() => fallback.map(normalize), [fallback]);
  const queryResult = useQuery({
    queryKey: ['products', 'search', { collection, category, query: query || '' }],
    queryFn: () => fetchProducts({ source: 'search', collection, category, q: query || undefined }),
    placeholderData: fallbackProducts,
    ...productsQueryDefaults,
  });

  const products = useMemo(
    () => (Array.isArray(queryResult.data) ? queryResult.data.map(normalize) : fallbackProducts),
    [fallbackProducts, queryResult.data]
  );

  const loading = queryResult.isLoading && !products.length;
  const error = queryResult.error?.response?.data?.message || queryResult.error?.message || '';

  return useMemo(() => ({ products, loading, error }), [products, loading, error]);
}
