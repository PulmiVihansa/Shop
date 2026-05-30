const COLLECTION_OPTIONS = ['female', 'male', 'accessories'];

const PRODUCT_STRUCTURE = {
  female: {
    categories: ['Dresses', 'Tops'],
    subcategories: {
      Dresses: ['Midi', 'Maxi', 'Mini', 'Evening'],
      Tops: ['Blouses', 'Shirts', 'Knitwear', 'Vests']
    }
  },
  male: {
    categories: ['Shirts', 'Trousers'],
    subcategories: {
      Shirts: ['All', 'Linen', 'Poplin', 'Chambray', 'Oxford'],
      Trousers: ['Slim', 'Wide Leg', 'Tailored', 'Casual']
    }
  },
  accessories: {
    categories: ['Bags', 'Belts', 'Scarves', 'Small Leather'],
    subcategories: {}
  }
};

const normalizeCollection = (value, fallback = '') => {
  const key = String(value || fallback || '').trim().toLowerCase();
  if (key === 'female' || key === 'male' || key === 'accessories') return key;
  return fallback || '';
};

const normalizeCategory = (collection, value, fallback = '') => {
  const options = PRODUCT_STRUCTURE[collection]?.categories || [];
  const text = String(value || fallback || '').trim();
  if (!text) return fallback || '';
  return options.find((option) => option.toLowerCase() === text.toLowerCase()) || fallback || '';
};

const normalizeSubcategory = (collection, category, value, fallback = '') => {
  const options = PRODUCT_STRUCTURE[collection]?.subcategories?.[category] || [];
  const text = String(value || fallback || '').trim();
  if (!text) return fallback || '';
  if (collection === 'accessories') return '';
  return options.find((option) => option.toLowerCase() === text.toLowerCase()) || fallback || '';
};

const getDefaultCollectionCategory = (collection) => PRODUCT_STRUCTURE[collection]?.categories?.[0] || '';
const getDefaultCollectionSubcategory = (collection, category) => PRODUCT_STRUCTURE[collection]?.subcategories?.[category]?.[0] || '';

module.exports = {
  COLLECTION_OPTIONS,
  PRODUCT_STRUCTURE,
  normalizeCollection,
  normalizeCategory,
  normalizeSubcategory,
  getDefaultCollectionCategory,
  getDefaultCollectionSubcategory,
};
