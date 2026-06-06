export const PRODUCT_STRUCTURE = {
  men: {
    label: 'Men',
    categories: {
      'Graphic Tees': [],
      'Oversized Tees': [],
      'Premium T-Shirts': [],
      Shirts: [],
      'Polo Shirts': [],
      Jackets: [],
      Hoodies: [],
      Sweatshirts: []
    }
  }
};

export const COLLECTION_OPTIONS = [
  { value: 'men', label: 'Men' }
];

export const getCategoryOptions = (collection = 'men') => Object.keys(PRODUCT_STRUCTURE[collection]?.categories || {});
