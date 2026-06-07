import api from '../services/api.js';

const apiOrigin = () => String(api.defaults.baseURL || '').replace(/\/api\/?$/, '');

export const resolveImageUrl = (value) => {
  const image = String(value || '').trim();
  if (!image) return '';
  if (/^(https?:|data:|blob:)/i.test(image)) return image;
  if (image.startsWith('/uploads/')) return `${apiOrigin()}${image}`;
  return image;
};

export const resolveImageList = (images = []) => (
  Array.isArray(images) ? images.map(resolveImageUrl).filter(Boolean) : []
);
