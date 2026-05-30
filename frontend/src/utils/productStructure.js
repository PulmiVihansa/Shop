export const PRODUCT_STRUCTURE = {
  female: {
    label: 'Female',
    categories: {
      Dresses: ['Midi', 'Maxi', 'Mini', 'Evening'],
      Tops: ['Blouses', 'Shirts', 'Knitwear', 'Vests']
    }
  },
  male: {
    label: 'Male',
    categories: {
      Shirts: ['All', 'Linen', 'Poplin', 'Chambray', 'Oxford'],
      Trousers: ['Slim', 'Wide Leg', 'Tailored', 'Casual']
    }
  },
  accessories: {
    label: 'Accessories',
    categories: {
      Bags: [],
      Belts: [],
      Scarves: [],
      'Small Leather': []
    }
  }
};

export const COLLECTION_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'accessories', label: 'Accessories' }
];

export const getCategoryOptions = (collection) => Object.keys(PRODUCT_STRUCTURE[collection]?.categories || {});
export const getSubcategoryOptions = (collection, category) => PRODUCT_STRUCTURE[collection]?.categories?.[category] || [];
