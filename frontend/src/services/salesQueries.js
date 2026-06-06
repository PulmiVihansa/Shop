import api from './api.js';
import { QUERY_GC_TIME, QUERY_STALE_TIME } from './queryClient.js';

export const salesProductsKey = ['sales', 'active-products'];

export const salesQueryDefaults = {
  staleTime: QUERY_STALE_TIME,
  gcTime: QUERY_GC_TIME,
  refetchOnWindowFocus: false,
};

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

export const normalizeSaleProduct = (entry = {}) => {
  const product = entry.product || {};
  const image = entry.image || product.images?.[0] || product.image || '';
  return {
    id: entry.productId || product.id || product._id || entry.id || entry._id,
    campaignId: entry.id || entry._id,
    name: entry.productName || product.name || entry.name || 'Astravia Product',
    image,
    price: Number(entry.originalPrice || product.price || 0),
    salePrice: Number(entry.salePrice || 0),
    discount: Number(entry.discountPercentage || 0),
    badge: entry.badge || 'Sale',
    category: entry.category || product.category || 'Sale',
    colors: toList(entry.colors || product.colors),
    sizes: toList(entry.sizes?.length ? entry.sizes : product.sizes),
    product,
  };
};

export const fetchSalesProducts = async () => {
  const response = await api.get('/sales');
  return Array.isArray(response.data) ? response.data.map(normalizeSaleProduct) : [];
};

export const salesProductsQuery = {
  queryKey: salesProductsKey,
  queryFn: fetchSalesProducts,
  ...salesQueryDefaults,
};

export const prefetchSalesProducts = (queryClient) =>
  queryClient.prefetchQuery(salesProductsQuery).catch(() => {});
