const prisma = require('../config/prisma');
const { store, createId, seedProducts } = require('../data/memoryStore');

const INVENTORY_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const DEFAULT_REORDER_THRESHOLD = 15;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sanitizeText = (value, fallback = '') => {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const sanitizeStringArray = (value, fallback = []) => {
  if (!Array.isArray(value)) return fallback;
  return value.map((item) => sanitizeText(item)).filter(Boolean);
};

const normalizeSizeCode = (value) => sanitizeText(value).toUpperCase();

const getAllSizeKeys = (sizes = [], sizeStock = {}) => {
  const dynamicSizes = sanitizeStringArray(sizes).map(normalizeSizeCode);
  const stockKeys = Object.keys(sizeStock || {}).map(normalizeSizeCode);
  return Array.from(new Set([...INVENTORY_SIZES, ...dynamicSizes, ...stockKeys])).filter(Boolean);
};

const normalizeSizeStock = (sizeStock = {}, sizes = []) => {
  const keys = getAllSizeKeys(sizes, sizeStock);
  return keys.reduce((acc, key) => {
    acc[key] = Math.max(0, Math.trunc(toNumber(sizeStock?.[key], 0)));
    return acc;
  }, {});
};

const getTotalStock = (sizeStock = {}) =>
  Object.values(sizeStock).reduce((sum, value) => sum + Math.max(0, Math.trunc(toNumber(value, 0))), 0);

const getReorderThreshold = () => DEFAULT_REORDER_THRESHOLD;

const getStatus = (totalStock, reorderThreshold) => {
  if (totalStock <= 0) return 'out';
  if (totalStock < reorderThreshold) return 'low';
  return 'healthy';
};

const getSku = (product) => `SKU-${String(product?._id || product?.id || '').slice(-8).toUpperCase()}`;

const toInventoryRecord = (product) => {
  const normalized = normalizeProduct(product);
  const sizeStock = normalizeSizeStock(normalized.sizeStock || {}, normalized.sizes || []);
  const totalStock = getTotalStock(sizeStock);
  const reorderThreshold = getReorderThreshold(normalized);
  const inventoryValue = totalStock * toNumber(normalized.price, 0);
  const status = getStatus(totalStock, reorderThreshold);

  return {
    ...normalized,
    sizeStock,
    sizes: getAllSizeKeys(normalized.sizes || [], sizeStock),
    stock: totalStock,
    sku: getSku(normalized),
    reorderThreshold,
    inventoryValue,
    status,
    lowStock: status === 'low',
    outOfStock: status === 'out'
  };
};

const sortInventoryRecords = (records, sortBy = 'recent') => {
  const collection = [...records];

  if (sortBy === 'name') {
    return collection.sort((a, b) => a.name.localeCompare(b.name));
  }
  if (sortBy === 'stock') {
    return collection.sort((a, b) => b.stock - a.stock);
  }
  if (sortBy === 'price') {
    return collection.sort((a, b) => toNumber(b.price, 0) - toNumber(a.price, 0));
  }
  if (sortBy === 'value') {
    return collection.sort((a, b) => b.inventoryValue - a.inventoryValue);
  }

  return collection.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

const applyInventoryFilters = (records, filter = {}) =>
  records.filter((product) => {
    if (filter.name && !product.name.toLowerCase().includes(filter.name.toLowerCase())) return false;
    if (filter.sku) {
      const query = filter.sku.toLowerCase();
      const idMatch = String(product.id || '').toLowerCase().includes(query);
      const skuMatch = String(product.sku || '').toLowerCase().includes(query);
      if (!idMatch && !skuMatch) return false;
    }
    if (filter.category && product.category !== filter.category) return false;
    if (filter.tag && !(product.tags || []).includes(filter.tag)) return false;
    if (filter.badge && String(product.badge || '').toLowerCase() !== String(filter.badge).toLowerCase()) return false;
    if (filter.lowStockOnly && !product.lowStock) return false;
    if (filter.outOfStockOnly && !product.outOfStock) return false;
    return true;
  });

const sanitizeProductPayload = (payload = {}, existing = null) => {
  const next = {
    name: sanitizeText(payload.name, existing?.name || ''),
    price: toNumber(payload.price, toNumber(existing?.price, 0)),
    description: sanitizeText(payload.description, existing?.description || ''),
    category: sanitizeText(payload.category, existing?.category || ''),
    images: sanitizeStringArray(payload.images, existing?.images || []),
    sizes: sanitizeStringArray(payload.sizes, existing?.sizes || []),
    tags: sanitizeStringArray(payload.tags, existing?.tags || []),
    badge: sanitizeText(payload.badge, existing?.badge || ''),
    badgeText: sanitizeText(payload.badgeText, existing?.badgeText || ''),
    bgClass: sanitizeText(payload.bgClass, existing?.bgClass || 'b1'),
    swatches: sanitizeStringArray(payload.swatches, existing?.swatches || []),
    imageClass: sanitizeText(payload.imageClass, existing?.imageClass || 'linen')
  };

  const mergedSizeStock = normalizeSizeStock(payload.sizeStock || existing?.sizeStock || {}, next.sizes);
  const providedStock = toNumber(payload.stock, NaN);
  next.sizeStock = mergedSizeStock;
  next.stock = Number.isFinite(providedStock) ? Math.max(0, Math.trunc(providedStock)) : getTotalStock(mergedSizeStock);
  if (payload.sizeStock) {
    next.stock = getTotalStock(mergedSizeStock);
  }

  return next;
};

const monthKey = (date) => new Date(date).toLocaleString('en-US', { month: 'short', year: 'numeric' });

const buildInventoryInsights = (records) => {
  if (!records.length) {
    return {
      highestStockProduct: null,
      lowestStockProduct: null,
      mostValuableProduct: null,
      totalInventoryValue: 0,
      stockByCategory: [],
      inventoryValueByCategory: [],
      stockDistributionByCategory: [],
      lowStockTrend: []
    };
  }

  const highestStockProduct = [...records].sort((a, b) => b.stock - a.stock)[0];
  const lowestStockProduct = [...records].sort((a, b) => a.stock - b.stock)[0];
  const mostValuableProduct = [...records].sort((a, b) => b.inventoryValue - a.inventoryValue)[0];
  const totalInventoryValue = records.reduce((sum, product) => sum + product.inventoryValue, 0);

  const byCategory = records.reduce((acc, product) => {
    const key = product.category || 'uncategorized';
    if (!acc[key]) {
      acc[key] = {
        label: key,
        stock: 0,
        value: 0,
        products: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      };
    }
    acc[key].stock += product.stock;
    acc[key].value += product.inventoryValue;
    acc[key].products += 1;
    if (product.lowStock) acc[key].lowStockCount += 1;
    if (product.outOfStock) acc[key].outOfStockCount += 1;
    return acc;
  }, {});

  const stockByCategory = Object.values(byCategory).map((item) => ({ label: item.label, value: item.stock }));
  const inventoryValueByCategory = Object.values(byCategory).map((item) => ({ label: item.label, value: item.value }));
  const stockDistributionByCategory = Object.values(byCategory);

  const trendMap = records.reduce((acc, product) => {
    const key = monthKey(product.createdAt || new Date());
    if (!acc[key]) acc[key] = { label: key, lowStock: 0, outOfStock: 0 };
    if (product.lowStock) acc[key].lowStock += 1;
    if (product.outOfStock) acc[key].outOfStock += 1;
    return acc;
  }, {});
  const lowStockTrend = Object.values(trendMap).sort((a, b) => new Date(a.label) - new Date(b.label));

  return {
    highestStockProduct,
    lowestStockProduct,
    mostValuableProduct,
    totalInventoryValue,
    stockByCategory,
    inventoryValueByCategory,
    stockDistributionByCategory,
    lowStockTrend
  };
};

const getInventorySummary = (records) => {
  const totalProducts = records.length;
  const totalUnits = records.reduce((sum, product) => sum + product.stock, 0);
  const totalInventoryValue = records.reduce((sum, product) => sum + product.inventoryValue, 0);
  const lowStockProducts = records.filter((product) => product.lowStock).length;
  const outOfStockProducts = records.filter((product) => product.outOfStock).length;
  return { totalProducts, totalInventoryValue, lowStockProducts, outOfStockProducts, totalUnits };
};

const normalizeProduct = (product) => ({
  id: product._id || product.id,
  _id: product._id || product.id,
  name: product.name,
  title: product.name,
  price: product.price,
  description: product.description,
  category: product.category,
  categoryLabel: product.categoryLabel || product.category,
  images: product.images || [],
  sizes: product.sizes || [],
  stock: product.stock,
  sizeStock: product.sizeStock || {},
  tags: product.tags || [],
  badge: product.badge,
  badgeText: product.badgeText,
  bgClass: product.bgClass,
  swatches: product.swatches || [],
  imageClass: product.imageClass,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt
});

const productMatches = (product, filter) => {
  if (filter.category && product.category !== filter.category) return false;
  if (filter.tag && !product.tags?.includes(filter.tag)) return false;
  if (filter.q && !product.name.toLowerCase().includes(filter.q.toLowerCase())) return false;
  return true;
};

const getProducts = async (req, res) => {
  try {
    const { category, tag, q } = req.query;

    if (global.useMemoryStore) {
      seedProducts();
      const products = store.products.filter((product) => productMatches(product, { category, tag, q }));
      return res.json(products.map(normalizeProduct));
    }

    const where = {};

    if (category) where.category = category;
    if (tag) where.tags = { has: tag };
    if (q) where.name = { contains: q, mode: 'insensitive' };

    const products = await prisma.product.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(products.map(normalizeProduct));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      seedProducts();
      const product = store.products.find((entry) => entry._id === req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.json(normalizeProduct(product));
    }

    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(normalizeProduct(product));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const payload = sanitizeProductPayload(req.body);
    if (global.useMemoryStore) {
      const product = {
        _id: createId(),
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      store.products.unshift(product);
      return res.status(201).json(normalizeProduct(product));
    }

    const product = await prisma.product.create({ data: payload });
    res.status(201).json(normalizeProduct(product));
  } catch (error) {
    res.status(400).json({ message: 'Failed to create product', error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const index = store.products.findIndex((entry) => entry._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Product not found' });
      }
      const payload = sanitizeProductPayload(req.body, store.products[index]);
      store.products[index] = { ...store.products[index], ...payload, updatedAt: new Date() };
      return res.json(normalizeProduct(store.products[index]));
    }

    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const payload = sanitizeProductPayload(req.body, existing);
    const product = await prisma.product.update({ where: { id: req.params.id }, data: payload });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(normalizeProduct(product));
  } catch (error) {
    res.status(400).json({ message: 'Failed to update product', error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const index = store.products.findIndex((entry) => entry._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Product not found' });
      }
      store.products.splice(index, 1);
      return res.json({ message: 'Product deleted' });
    }

    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
};

const restockProduct = async (req, res) => {
  try {
    const quantity = Number(req.body.quantity || 0);
    const { size, sizeStock } = req.body;
    if (quantity <= 0) {
      return res.status(400).json({ message: 'Restock quantity must be greater than zero' });
    }

    if (global.useMemoryStore) {
      const product = store.products.find((entry) => entry._id === req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      product.sizeStock = normalizeSizeStock(product.sizeStock, product.sizes);
      if (size && product.sizeStock[size] !== undefined) {
        product.sizeStock[size] = Number(product.sizeStock[size] || 0) + quantity;
      } else if (sizeStock) {
        product.sizeStock = normalizeSizeStock({ ...product.sizeStock, ...sizeStock }, product.sizes);
      }
      product.stock = getTotalStock(product.sizeStock);
      product.updatedAt = new Date();
      return res.json(normalizeProduct(product));
    }

    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    const nextSizeStock = normalizeSizeStock(existing.sizeStock, existing.sizes);
    let nextStock = Number(existing.stock || 0);
    if (size && nextSizeStock[size] !== undefined) {
      nextSizeStock[size] = Number(nextSizeStock[size] || 0) + quantity;
      nextStock += quantity;
    } else if (sizeStock) {
      const merged = normalizeSizeStock({ ...nextSizeStock, ...sizeStock }, existing.sizes);
      Object.keys(nextSizeStock).forEach((key) => delete nextSizeStock[key]);
      Object.assign(nextSizeStock, merged);
      nextStock = getTotalStock(nextSizeStock);
    } else {
      nextStock += quantity;
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { sizeStock: nextSizeStock, stock: nextStock }
    });
    res.json(normalizeProduct(product));
  } catch (error) {
    res.status(400).json({ message: 'Failed to restock product', error: error.message });
  }
};

const getInventoryDashboard = async (req, res) => {
  try {
    const { name, sku, category, tag, badge, lowStockOnly, outOfStockOnly, sortBy } = req.query;
    let products = [];

    if (global.useMemoryStore) {
      seedProducts();
      products = store.products;
    } else {
      products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    }

    const records = products.map(toInventoryRecord);
    const filtered = applyInventoryFilters(records, {
      name,
      sku,
      category,
      tag,
      badge,
      lowStockOnly: String(lowStockOnly) === 'true',
      outOfStockOnly: String(outOfStockOnly) === 'true'
    });
    const sorted = sortInventoryRecords(filtered, sortBy);
    const summary = getInventorySummary(records);
    const lowStockList = records
      .filter((product) => product.lowStock || product.outOfStock)
      .map((product) => ({
        id: product.id,
        name: product.name,
        image: product.images?.[0] || '',
        stock: product.stock,
        reorderThreshold: product.reorderThreshold,
        missingQuantity: Math.max(0, product.reorderThreshold - product.stock)
      }))
      .sort((a, b) => b.missingQuantity - a.missingQuantity);
    const insights = buildInventoryInsights(records);

    res.json({
      summary,
      filters: { name: name || '', sku: sku || '', category: category || '', tag: tag || '', badge: badge || '', lowStockOnly: String(lowStockOnly) === 'true', outOfStockOnly: String(outOfStockOnly) === 'true', sortBy: sortBy || 'recent' },
      items: sorted,
      count: sorted.length,
      lowStockList,
      insights
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load inventory dashboard', error: error.message });
  }
};

const updateProductStock = async (req, res) => {
  try {
    const action = sanitizeText(req.body.action).toLowerCase();
    const size = normalizeSizeCode(req.body.size);
    const quantity = Math.max(0, Math.trunc(toNumber(req.body.quantity, 0)));
    const note = sanitizeText(req.body.notes || req.body.reason || '');

    if (!['increase', 'reduce'].includes(action)) {
      return res.status(400).json({ message: 'Stock action must be either increase or reduce' });
    }
    if (!size) {
      return res.status(400).json({ message: 'Size is required' });
    }
    if (!INVENTORY_SIZES.includes(size)) {
      return res.status(400).json({ message: 'Invalid size code' });
    }
    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than zero' });
    }

    if (global.useMemoryStore) {
      const product = store.products.find((entry) => entry._id === req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      const sizeStock = normalizeSizeStock(product.sizeStock, product.sizes);
      const current = toNumber(sizeStock[size], 0);
      if (action === 'reduce' && current < quantity) {
        return res.status(400).json({ message: `Cannot reduce ${quantity} units from size ${size}. Available: ${current}` });
      }

      sizeStock[size] = action === 'increase' ? current + quantity : current - quantity;
      product.sizeStock = sizeStock;
      product.stock = getTotalStock(sizeStock);
      product.updatedAt = new Date();

      return res.json({
        product: toInventoryRecord(product),
        movement: { action, size, quantity, note, updatedAt: product.updatedAt }
      });
    }

    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    const sizeStock = normalizeSizeStock(existing.sizeStock, existing.sizes);
    const current = toNumber(sizeStock[size], 0);
    if (action === 'reduce' && current < quantity) {
      return res.status(400).json({ message: `Cannot reduce ${quantity} units from size ${size}. Available: ${current}` });
    }

    sizeStock[size] = action === 'increase' ? current + quantity : current - quantity;
    const stock = getTotalStock(sizeStock);

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { sizeStock, stock }
    });

    res.json({
      product: toInventoryRecord(updated),
      movement: { action, size, quantity, note, updatedAt: updated.updatedAt }
    });
  } catch (error) {
    res.status(400).json({ message: 'Failed to update stock', error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
  getInventoryDashboard,
  updateProductStock
};
