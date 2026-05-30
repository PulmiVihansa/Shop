export const getProductId = (product) => product?.id || product?._id || product?.productId || '';

export const getProductSizes = (product) => {
  const sizes = Array.isArray(product?.sizes) ? product.sizes.filter(Boolean) : [];
  return sizes.length ? sizes : ['One Size'];
};

export const getProductImage = (product) => {
  if (Array.isArray(product?.images)) return product.images.find(Boolean) || '';
  return product?.image || '';
};

export const createCartItem = (product, size) => ({
  productId: getProductId(product),
  name: product?.name,
  image: getProductImage(product),
  price: product?.price,
  size,
  quantity: 1,
});
