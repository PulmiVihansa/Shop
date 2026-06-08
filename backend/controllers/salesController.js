const prisma = require('../config/prisma');
const { store, createId, seedProducts } = require('../data/memoryStore');
const { withId } = require('../utils/dbFormat');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toDate = (value, fallback = new Date()) => {
  const date = new Date(value || fallback);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const calculateDiscount = (originalPrice, salePrice) => {
  const original = toNumber(originalPrice, 0);
  const sale = toNumber(salePrice, 0);
  if (original <= 0 || sale < 0) return 0;
  return Math.max(0, Math.round(((original - sale) / original) * 100));
};

const getProductImage = (product) => product?.images?.[0] || product?.image || '';
const saleProductSelect = {
  id: true,
  name: true,
  price: true,
  category: true,
  colors: true,
  images: true,
  sizes: true,
  sizeStock: true,
  stock: true,
};

const serializeSale = (campaign) => {
  const product = campaign.product || {};
  return {
    ...withId(campaign),
    product: product.id || product._id ? withId(product) : product,
    productId: campaign.productId || product.id || product._id,
    productName: product.name || campaign.productName || '',
    image: getProductImage(product),
    images: product.images || [],
    name: product.name || campaign.productName || '',
    category: product.category || '',
    sizes: product.sizes || [],
    colors: product.colors || [],
    price: Number(product.price || 0),
    originalPrice: Number(product.price || 0),
    salePrice: Number(campaign.salePrice || 0),
    discountPercentage: Number(campaign.discountPercentage || 0),
    badge: campaign.badge || 'Sale',
    isActive: Boolean(campaign.isActive),
  };
};

const sanitizeSalePayload = (body = {}, existing = null) => {
  const originalPrice = toNumber(body.originalPrice, toNumber(existing?.originalPrice, 0));
  const salePrice = toNumber(body.salePrice, toNumber(existing?.salePrice, 0));
  return {
    productId: String(body.productId || existing?.productId || '').trim(),
    originalPrice,
    salePrice,
    discountPercentage: calculateDiscount(originalPrice, salePrice),
    badge: String(body.badge ?? existing?.badge ?? 'Sale').trim() || 'Sale',
    startDate: toDate(body.startDate, existing?.startDate || new Date()),
    endDate: toDate(body.endDate, existing?.endDate || new Date()),
    isActive: body.isActive === undefined ? Boolean(existing?.isActive ?? true) : Boolean(body.isActive),
  };
};

const getMemorySales = ({ activeOnly = false } = {}) => {
  seedProducts();
  const now = new Date();
  const sales = store.saleCampaigns || [];
  return sales
    .map((sale) => ({
      ...sale,
      product: store.products.find((product) => (product.id || product._id) === sale.productId),
    }))
    .filter((sale) => !activeOnly || (sale.isActive && new Date(sale.startDate) <= now && new Date(sale.endDate) >= now))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

const getSales = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      return res.json(getMemorySales({ activeOnly: true }).map(serializeSale));
    }

    const now = new Date();
    const campaigns = await prisma.saleCampaign.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: { product: { select: saleProductSelect } },
      orderBy: [{ createdAt: 'desc' }],
    });

    return res.json(campaigns.map(serializeSale));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminSales = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      return res.json(getMemorySales().map(serializeSale));
    }

    const campaigns = await prisma.saleCampaign.findMany({
      include: { product: { select: saleProductSelect } },
      orderBy: [{ createdAt: 'desc' }],
    });

    return res.json(campaigns.map(serializeSale));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createSale = async (req, res) => {
  try {
    const payload = sanitizeSalePayload(req.body);
    if (!payload.productId) {
      return res.status(400).json({ success: false, message: 'Product is required' });
    }
    if (payload.salePrice <= 0 || payload.originalPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Original and sale prices must be greater than zero' });
    }
    if (payload.endDate < payload.startDate) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    if (global.useMemoryStore) {
      seedProducts();
      const product = store.products.find((entry) => (entry.id || entry._id) === payload.productId);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      payload.originalPrice = toNumber(product.price, 0);
      payload.discountPercentage = calculateDiscount(payload.originalPrice, payload.salePrice);
      store.saleCampaigns = store.saleCampaigns || [];
      const sale = { id: createId(), ...payload, createdAt: new Date(), updatedAt: new Date(), product };
      store.saleCampaigns.unshift(sale);
      return res.status(201).json(serializeSale(sale));
    }

    const product = await prisma.product.findUnique({ where: { id: payload.productId } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    payload.originalPrice = toNumber(product.price, 0);
    payload.discountPercentage = calculateDiscount(payload.originalPrice, payload.salePrice);

    const campaign = await prisma.saleCampaign.create({
      data: payload,
      include: { product: { select: saleProductSelect } },
    });
    return res.status(201).json(serializeSale(campaign));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateSale = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const sales = store.saleCampaigns || [];
      const index = sales.findIndex((sale) => sale.id === req.params.id || sale._id === req.params.id);
      if (index === -1) return res.status(404).json({ success: false, message: 'Sale campaign not found' });
      const payload = sanitizeSalePayload(req.body, sales[index]);
      const product = store.products.find((entry) => (entry.id || entry._id) === payload.productId);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      payload.originalPrice = toNumber(product.price, 0);
      payload.discountPercentage = calculateDiscount(payload.originalPrice, payload.salePrice);
      sales[index] = { ...sales[index], ...payload, updatedAt: new Date() };
      return res.json(serializeSale({ ...sales[index], product: store.products.find((product) => (product.id || product._id) === sales[index].productId) }));
    }

    const existing = await prisma.saleCampaign.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Sale campaign not found' });
    const payload = sanitizeSalePayload(req.body, existing);
    if (payload.endDate < payload.startDate) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }
    const product = await prisma.product.findUnique({ where: { id: payload.productId } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    payload.originalPrice = toNumber(product.price, 0);
    payload.discountPercentage = calculateDiscount(payload.originalPrice, payload.salePrice);

    const campaign = await prisma.saleCampaign.update({
      where: { id: req.params.id },
      data: payload,
      include: { product: { select: saleProductSelect } },
    });
    return res.json(serializeSale(campaign));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSale = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const sales = store.saleCampaigns || [];
      store.saleCampaigns = sales.filter((sale) => sale.id !== req.params.id && sale._id !== req.params.id);
      return res.json({ success: true, message: 'Sale campaign deleted' });
    }

    await prisma.saleCampaign.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Sale campaign deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSales,
  getAdminSales,
  createSale,
  updateSale,
  deleteSale,
};
