const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const toSizeList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const sortSizes = (sizes) => {
  const order = new Map(SIZE_ORDER.map((size, index) => [size, index]));
  return [...new Set(sizes.map((size) => String(size || '').trim()).filter(Boolean))]
    .sort((a, b) => {
      const aIndex = order.has(a.toUpperCase()) ? order.get(a.toUpperCase()) : 999;
      const bIndex = order.has(b.toUpperCase()) ? order.get(b.toUpperCase()) : 999;
      return aIndex === bIndex ? a.localeCompare(b) : aIndex - bIndex;
    });
};

export const getAvailableSizes = (product = {}) => {
  const sizeStock = product?.sizeStock && typeof product.sizeStock === 'object' ? product.sizeStock : null;
  if (sizeStock && Object.keys(sizeStock).length) {
    return sortSizes(
      Object.entries(sizeStock)
        .filter(([, quantity]) => Number(quantity || 0) > 0)
        .map(([size]) => size)
    );
  }
  return sortSizes(toSizeList(product?.sizes));
};

export const getAvailableSizeOptions = (products = []) => (
  sortSizes(products.flatMap((product) => getAvailableSizes(product)))
);
