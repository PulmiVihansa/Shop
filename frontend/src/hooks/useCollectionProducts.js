import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts, productsQueryDefaults } from '../services/productsQueries.js';
import { resolveImageList } from '../utils/imageUrl.js';

const STALE_TIME = 5 * 60 * 1000;
const cacheKey = 'men-collection';
const listeners = new Set();

const toList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeFilterValue = (value) => String(value || '').trim().toLowerCase();

const uniqueSorted = (values) => {
  const unique = values.reduce((acc, value) => {
    const label = String(value || '').trim();
    const key = normalizeFilterValue(label);
    if (key && !acc.has(key)) acc.set(key, label);
    return acc;
  }, new Map());
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
};

const normalizeProduct = (product = {}) => {
  const images = resolveImageList(toList(product.images || product.image));
  const colors = toList(product.colors || product.colours || product.swatches);
  const sizeStock = product.sizeStock && typeof product.sizeStock === 'object' ? product.sizeStock : {};
  const stock = Number(product.totalStock ?? product.stock ?? 0);

  return {
    ...product,
    id: product.id || product._id || product.slug,
    _id: product._id || product.id || product.slug,
    name: product.name || product.title || '',
    slug: product.slug || product.id || product._id,
    price: Number(product.price || 0),
    collection: 'men',
    category: product.category || '',
    colors,
    images,
    image: images[0] || '',
    sizes: toList(product.sizes),
    sizeStock,
    stock,
    totalStock: stock,
    badges: toList(product.badges),
  };
};

const buildFilters = (products) => ({
  categories: uniqueSorted(products.map((product) => product.category)),
  colors: uniqueSorted(products.flatMap((product) => product.colors || [])),
});

const productCache = new Map([
  [
    cacheKey,
    {
      products: [],
      filters: { categories: [], colors: [] },
      fetchedAt: 0,
      promise: null,
      error: '',
      isFetching: false,
    },
  ],
]);

const getEntry = () => productCache.get(cacheKey);
const isFresh = (entry) => entry.products.length > 0 && Date.now() - entry.fetchedAt < STALE_TIME;
const notify = () => listeners.forEach((listener) => listener());

const setEntry = (next) => {
  productCache.set(cacheKey, { ...getEntry(), ...next });
  notify();
};

export const getCollectionProductsSnapshot = () => {
  const entry = getEntry();
  return {
    products: entry.products,
    filters: entry.filters,
    loading: entry.isFetching && !entry.products.length,
    isFetching: entry.isFetching,
    error: entry.error,
  };
};

export const fetchCollectionProducts = ({ force = false } = {}) => {
  const entry = getEntry();
  if (!force && isFresh(entry)) return Promise.resolve(entry.products);
  if (entry.promise) return entry.promise;

  const promise = fetchProducts({ source: 'collection', collection: 'men', view: 'collection' })
    .then((response) => {
      const products = Array.isArray(response) ? response.map(normalizeProduct) : [];
      setEntry({
        products,
        filters: buildFilters(products),
        fetchedAt: Date.now(),
        promise: null,
        error: '',
        isFetching: false,
      });
      return products;
    })
    .catch((error) => {
      setEntry({
        promise: null,
        error: error?.response?.data?.message || 'Unable to load collection',
        isFetching: false,
      });
      throw error;
    });

  setEntry({ promise, error: '', isFetching: true });
  return promise;
};

export const prefetchCollectionProducts = () => {
  fetchCollectionProducts().catch(() => {});
};

export default function useCollectionProducts() {
  const [snapshot, setSnapshot] = useState(getCollectionProductsSnapshot);
  const queryResult = useQuery({
    queryKey: ['products', 'collection', 'men'],
    queryFn: () => fetchCollectionProducts(),
    ...productsQueryDefaults,
  });

  useEffect(() => {
    const listener = () => setSnapshot(getCollectionProductsSnapshot());
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const mergedSnapshot = useMemo(
    () => ({
      ...snapshot,
      loading: queryResult.isLoading || snapshot.loading,
      error: queryResult.error?.response?.data?.message || queryResult.error?.message || snapshot.error,
    }),
    [queryResult.error, queryResult.isLoading, snapshot]
  );

  return mergedSnapshot;
}
