export const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const productId = (value = {}) => String(value.productId || value.product || value.id || value._id || '');

const productName = (value = {}) => String(value.productName || value.name || value.product?.name || '').trim().toLowerCase();

export const buildSaleMap = (sales = []) => {
  const byId = new Map();
  const byName = new Map();

  (Array.isArray(sales) ? sales : []).forEach((sale) => {
    const id = productId(sale);
    const name = productName(sale);
    if (id) byId.set(id, sale);
    if (name) byName.set(name, sale);
  });

  return { byId, byName };
};

export const buildProductMap = (products = []) => new Map(
  (Array.isArray(products) ? products : [])
    .filter((product) => productId(product))
    .map((product) => [productId(product), product])
);

export const resolvePricedItem = (item = {}, { productsById = new Map(), salesByProductId = new Map() } = {}) => {
  const id = productId(item);
  const product = productsById.get(id);
  const saleMaps = salesByProductId.byId ? salesByProductId : { byId: salesByProductId, byName: new Map() };
  const sale = saleMaps.byId.get(id) || saleMaps.byName.get(productName(product || item));
  const quantity = Math.max(1, Math.trunc(toNumber(item.quantity, 1)));
  const itemHasSaleSource = Boolean(item.isSale && item.saleCampaignId);
  const fallbackOriginalPrice = itemHasSaleSource ? toNumber(item.originalPrice, toNumber(product?.price, toNumber(item.price, 0))) : toNumber(item.price, 0);
  const originalPrice = toNumber(product?.price, fallbackOriginalPrice);
  const fallbackSalePrice = itemHasSaleSource ? toNumber(item.salePrice, toNumber(item.price, originalPrice)) : originalPrice;
  const configuredSalePrice = sale ? toNumber(sale.salePrice, fallbackSalePrice) : fallbackSalePrice;
  const isOnSale = Boolean(sale || itemHasSaleSource);
  const finalPrice = isOnSale ? Math.max(0, Math.min(originalPrice, configuredSalePrice)) : originalPrice;
  const saleDiscount = isOnSale ? Math.max(0, originalPrice - finalPrice) : 0;
  const defaultColor = Array.isArray(product?.colors) ? product.colors.find(Boolean) : '';

  return {
    ...item,
    productId: id,
    name: product?.name || item.name,
    image: item.image || product?.images?.[0] || product?.image || '',
    color: item.color || defaultColor || '',
    category: product?.category || item.category || '',
    price: finalPrice,
    originalPrice,
    salePrice: finalPrice,
    saleDiscount,
    isSale: Boolean(isOnSale && saleDiscount > 0),
    saleCampaignId: sale?.campaignId || sale?.id || sale?._id || item.saleCampaignId || '',
    quantity,
  };
};

export const itemMetaText = (item = {}) => [item.color, item.category, item.size].filter(Boolean).join(' / ');

export const isSaleItem = (item = {}) => (
  Boolean(item.isSale) &&
  toNumber(item.saleDiscount, 0) > 0 &&
  toNumber(item.originalPrice, 0) > toNumber(item.price, 0)
);

export const resolvePricedItems = (items = [], products = [], sales = []) => {
  const productsById = buildProductMap(products);
  const salesByProductId = buildSaleMap(sales);
  return (Array.isArray(items) ? items : []).map((item) => resolvePricedItem(item, { productsById, salesByProductId }));
};

export const pricingTotals = (items = [], shipping = 0) => {
  const subtotal = items.reduce((sum, item) => sum + toNumber(item.price, 0) * toNumber(item.quantity, 1), 0);
  const saleDiscount = items.reduce((sum, item) => sum + toNumber(item.saleDiscount, 0) * toNumber(item.quantity, 1), 0);
  return {
    subtotal,
    saleDiscount,
    discount: saleDiscount,
    total: subtotal + toNumber(shipping, 0),
  };
};
