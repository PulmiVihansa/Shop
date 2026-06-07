import api from './api.js';
import { QUERY_GC_TIME, QUERY_STALE_TIME } from './queryClient.js';

export const productsQueryDefaults = {
  staleTime: QUERY_STALE_TIME,
  gcTime: QUERY_GC_TIME,
  refetchOnWindowFocus: false,
  retry: false,
};

const inFlightProductRequests = new Map();

const debugProductsRequest = (source, params) => {
  if (import.meta.env.DEV) {
    console.debug('[products:request]', { source, params });
  }
};

export const fetchProducts = async ({ source = 'list', ...params } = {}) => {
  debugProductsRequest(source, params);
  const requestKey = JSON.stringify(Object.keys(params).sort().reduce((acc, key) => ({ ...acc, [key]: params[key] }), {}));
  if (inFlightProductRequests.has(requestKey)) return inFlightProductRequests.get(requestKey);

  const request = api.get('/products', { params })
    .then((response) => (Array.isArray(response.data) ? response.data : []))
    .finally(() => {
      inFlightProductRequests.delete(requestKey);
    });
  inFlightProductRequests.set(requestKey, request);
  return request;
};

export const fetchProductById = async (id) => {
  debugProductsRequest('detail', { id });
  const response = await api.get(`/products/${id}`);
  return response.data;
};
