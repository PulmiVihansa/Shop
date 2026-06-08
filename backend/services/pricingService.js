const prisma = require('../config/prisma');
const { store } = require('../data/memoryStore');

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toText = (value, fallback = '') => {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const productIdFromItem = (item = {}) => toText(item.product || item.productId || item.id || item._id);

const normalizeIncomingItems = (body = {}) => {
  const incoming = Array.isArray(body.items) ? body.items : [];
  const items = incoming.length ? incoming : [{
    product: body.product || body.productId,
    name: body.productName || 'Product',
    quantity: body.quantity || 1,
    size: body.size || 'One Size',
    image: body.image || '',
  }];

  return items.map((item) => ({
    product: productIdFromItem(item),
    name: toText(item.name, toText(body.productName, 'Product')),
    quantity: Math.max(1, Math.trunc(toNumber(item.quantity, 1))),
    size: toText(item.size, toText(body.size, 'One Size')),
    color: toText(item.color, toText(body.color, '')),
    category: toText(item.category, toText(body.category, '')),
    image: toText(item.image, ''),
  }));
};

const activeSaleForProduct = (campaigns = []) => {
  const now = new Date();
  return campaigns
    .filter((campaign) => (
      campaign.isActive &&
      new Date(campaign.startDate) <= now &&
      new Date(campaign.endDate) >= now
    ))
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))[0] || null;
};

const loadPricingRecords = async (productIds) => {
  if (global.useMemoryStore) {
    const products = (store.products || []).filter((product) => productIds.includes(String(product.id || product._id)));
    const sales = (store.saleCampaigns || []).filter((sale) => productIds.includes(String(sale.productId)));
    return { products, sales };
  }

  const [products, sales] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, images: true, category: true, colors: true },
    }),
    prisma.saleCampaign.findMany({
      where: {
        productId: { in: productIds },
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return { products, sales };
};

const priceOrderItems = async (body = {}) => {
  const incomingItems = normalizeIncomingItems(body).filter((item) => item.product);
  if (!incomingItems.length) throw new Error('Order must include at least one valid product');

  const productIds = Array.from(new Set(incomingItems.map((item) => item.product)));
  const { products, sales } = await loadPricingRecords(productIds);
  const productsById = new Map(products.map((product) => [String(product.id || product._id), product]));
  const salesByProductId = new Map();
  sales.forEach((sale) => {
    const current = salesByProductId.get(String(sale.productId));
    const next = activeSaleForProduct([current, sale].filter(Boolean));
    if (next) salesByProductId.set(String(sale.productId), next);
  });

  const items = incomingItems.map((item) => {
    const product = productsById.get(item.product);
    if (!product) throw new Error(`Product not found: ${item.product}`);

    const originalPrice = toNumber(product.price, 0);
    const sale = salesByProductId.get(item.product);
    const configuredSalePrice = sale ? toNumber(sale.salePrice, originalPrice) : originalPrice;
    const finalPrice = sale ? Math.max(0, Math.min(originalPrice, configuredSalePrice)) : originalPrice;
    const saleDiscount = sale ? Math.max(0, originalPrice - finalPrice) : 0;

    return {
      product: item.product,
      productId: item.product,
      name: product.name || item.name,
      price: finalPrice,
      originalPrice,
      salePrice: finalPrice,
      saleDiscount,
      discount: saleDiscount,
      isSale: Boolean(sale && saleDiscount > 0),
      saleCampaignId: sale?.id || sale?._id || '',
      quantity: item.quantity,
      size: item.size,
      color: item.color || product.colors?.[0] || '',
      category: product.category || item.category || '',
      image: item.image || product.images?.[0] || '',
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const originalSubtotal = items.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
  const discount = items.reduce((sum, item) => sum + item.saleDiscount * item.quantity, 0);

  return {
    items,
    subtotal,
    originalSubtotal,
    discount,
  };
};

const orderItemDiscountTotal = (items = []) => (
  (Array.isArray(items) ? items : []).reduce((sum, item) => (
    sum + toNumber(item.saleDiscount ?? item.discount, 0) * Math.max(1, Math.trunc(toNumber(item.quantity, 1)))
  ), 0)
);

module.exports = {
  normalizeIncomingItems,
  orderItemDiscountTotal,
  priceOrderItems,
};
