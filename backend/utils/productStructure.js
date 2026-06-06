const COLLECTION_OPTIONS = ['men'];

const PRODUCT_STRUCTURE = {
  men: {
    categories: ['Graphic Tees', 'Oversized Tees', 'Premium T-Shirts', 'Shirts', 'Polo Shirts', 'Jackets', 'Hoodies', 'Sweatshirts']
  }
};

const normalizeCollection = (value, fallback = '') => {
  return 'men';
};

const normalizeCategory = (collection, value, fallback = '') => {
  const options = PRODUCT_STRUCTURE[collection]?.categories || [];
  const text = String(value || fallback || '').trim();
  if (!text) return fallback || '';
  return options.find((option) => option.toLowerCase() === text.toLowerCase()) || fallback || '';
};

const getDefaultCollectionCategory = (collection) => PRODUCT_STRUCTURE[collection]?.categories?.[0] || '';

module.exports = {
  COLLECTION_OPTIONS,
  PRODUCT_STRUCTURE,
  normalizeCollection,
  normalizeCategory,
  getDefaultCollectionCategory,
};
