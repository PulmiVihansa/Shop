const prisma = require('../config/prisma');
const { store, createId, seedProducts } = require('../data/memoryStore');
const fs = require('fs');
const path = require('path');
const { productUploadsDir, toProductImagePath } = require('../middleware/productImageUpload');
const {
  normalizeCollection,
  normalizeCategory,
  getDefaultCollectionCategory,
} = require('../utils/productStructure');

const INVENTORY_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const LOW_STOCK_LIMIT = 10;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sanitizeText = (value, fallback = '') => {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const parseJsonValue = (value, fallback) => {
  if (typeof value !== 'string') return value ?? fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const parseJsonObject = (value, fallback = {}) => {
  const parsed = parseJsonValue(value, fallback);
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
};

const sanitizeStringArray = (value, fallback = []) => {
  const parsed = parseJsonValue(value, value);
  if (Array.isArray(parsed)) return parsed.map((item) => sanitizeText(item)).filter(Boolean);
  if (typeof parsed === 'string') {
    return parsed
      .split(',')
      .map((item) => sanitizeText(item))
      .filter(Boolean);
  }
  return fallback;
};

const normalizeSizeCode = (value) => sanitizeText(value).toUpperCase();

const slugify = (value) =>
  sanitizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);

const sanitizeRating = (value, fallback = 0) => {
  const number = toNumber(value, fallback);
  return Math.min(5, Math.max(0, number));
};

const sanitizeJsonArray = (value, fallback = []) => {
  const parsed = parseJsonValue(value, value);
  return Array.isArray(parsed) ? parsed : fallback;
};

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

const getReorderThreshold = () => LOW_STOCK_LIMIT;

const getStatus = (totalStock) => {
  if (totalStock <= 0) return 'out';
  if (totalStock <= LOW_STOCK_LIMIT) return 'low';
  return 'healthy';
};

const getSku = (product) => `SKU-${String(product?._id || product?.id || '').slice(-8).toUpperCase()}`;

const toInventoryRecord = (product) => {
  const normalized = normalizeProduct(product);
  const sizeStock = normalizeSizeStock(normalized.sizeStock || {}, normalized.sizes || []);
  const totalStock = getTotalStock(sizeStock);
  const reorderThreshold = getReorderThreshold(normalized);
  const inventoryValue = totalStock * toNumber(normalized.price, 0);
  const status = getStatus(totalStock);

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
    if (filter.collection && normalizeCollection(product.collection, 'men') !== filter.collection) return false;
    if (filter.category && normalizeCategory('men', product.category, getDefaultCollectionCategory('men')) !== filter.category) return false;
    if (filter.lowStockOnly && !product.lowStock) return false;
    if (filter.outOfStockOnly && !product.outOfStock) return false;
    return true;
  });

const sanitizeProductPayload = (payload = {}, existing = null) => {
  const collection = normalizeCollection(payload.collection, existing?.collection || 'men');
  const category = normalizeCategory(collection, payload.category, getDefaultCollectionCategory(collection));
  const colors = sanitizeStringArray(payload.colors, existing?.colors || []);
  const name = sanitizeText(payload.name, existing?.name || '');
  const slug = slugify(payload.slug || existing?.slug || name);

  const next = {
    name,
    slug: slug || null,
    price: toNumber(payload.price, toNumber(existing?.price, 0)),
    description: sanitizeText(payload.description, existing?.description || ''),
    collection,
    category,
    colors,
    images: [
      ...sanitizeStringArray(payload.images, existing?.images || []).map(sanitizeStoredImage),
      ...sanitizeStringArray(payload.uploadedImages, []).map(sanitizeStoredImage),
    ].filter(Boolean),
    sizes: sanitizeStringArray(payload.sizes, existing?.sizes || []),
    badges: sanitizeStringArray(payload.badges, existing?.badges || []),
    material: sanitizeText(payload.material, existing?.material || ''),
    fabric: sanitizeText(payload.fabric, existing?.fabric || ''),
    fit: sanitizeText(payload.fit, existing?.fit || ''),
    careInstructions: sanitizeText(payload.careInstructions, existing?.careInstructions || ''),
    countryOfOrigin: sanitizeText(payload.countryOfOrigin, existing?.countryOfOrigin || ''),
    metaTitle: sanitizeText(payload.metaTitle, existing?.metaTitle || ''),
    metaDescription: sanitizeText(payload.metaDescription, existing?.metaDescription || ''),
    metaKeywords: sanitizeStringArray(payload.metaKeywords, existing?.metaKeywords || []),
    rating: sanitizeRating(payload.rating, existing?.rating || 0),
    reviewCount: Math.max(0, Math.trunc(toNumber(payload.reviewCount, existing?.reviewCount || 0))),
    reviews: sanitizeJsonArray(payload.reviews, existing?.reviews || []),
  };

  const mergedSizeStock = normalizeSizeStock(parseJsonObject(payload.sizeStock, existing?.sizeStock || {}), next.sizes);
  next.sizeStock = mergedSizeStock;
  next.stock = getTotalStock(mergedSizeStock);

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

const isBase64Image = (value) => /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(String(value || ''));

const isProductUploadPath = (value) => String(value || '').startsWith('/uploads/products/');

const sanitizeStoredImage = (image) => {
  const value = sanitizeText(image);
  if (!value || isBase64Image(value)) return '';
  return value;
};

const sanitizeProductImage = (image) => {
  const value = sanitizeText(image);
  return isBase64Image(value) ? '' : value;
};

const sanitizeProductImages = (images) => (
  Array.isArray(images) ? images.map(sanitizeProductImage).filter(Boolean) : []
);

const looksLikePlaceholderCopy = (value) => {
  const text = sanitizeText(value).toLowerCase();
  if (!text) return true;
  if (text.length < 18) return true;
  if (/^(test|demo|sample|placeholder|lorem ipsum)\b/.test(text)) return true;
  if (/^[a-z\s]{1,24}$/.test(text) && !/[aeiou].*[aeiou].*[aeiou]/.test(text)) return true;
  return false;
};

const publicProductDescription = (product) => {
  if (!looksLikePlaceholderCopy(product.description)) return product.description;
  const name = sanitizeText(product.name, 'Astravia piece');
  const category = sanitizeText(product.category, 'streetwear');
  return `${name} is an Astravia ${category} piece with a premium oversized fit, limited-drop energy, and everyday comfort.`;
};

const getUploadedProductImages = (req) => (
  Array.isArray(req.files) ? req.files.map(toProductImagePath).filter(Boolean) : []
);

const resolveProductUploadFile = (imagePath) => {
  if (!isProductUploadPath(imagePath)) return '';
  const filename = path.basename(imagePath);
  const resolved = path.resolve(productUploadsDir, filename);
  return resolved.startsWith(path.resolve(productUploadsDir)) ? resolved : '';
};

const deleteProductImageFiles = (images = []) => {
  sanitizeStringArray(images).forEach((imagePath) => {
    const filePath = resolveProductUploadFile(imagePath);
    if (filePath) fs.promises.unlink(filePath).catch(() => {});
  });
};

const deleteRemovedProductImages = (previousImages = [], nextImages = []) => {
  const nextSet = new Set(sanitizeStringArray(nextImages));
  const removed = sanitizeStringArray(previousImages).filter((image) => !nextSet.has(image));
  deleteProductImageFiles(removed);
};

const normalizeProduct = (product) => {
  const collection = normalizeCollection(product.collection, 'men');
  const category = normalizeCategory(collection, product.category, getDefaultCollectionCategory(collection));
  const sizeStock = normalizeSizeStock(product.sizeStock || {}, product.sizes || []);
  const stock = getTotalStock(sizeStock);
  const images = sanitizeProductImages(product.images || []);
  const description = publicProductDescription({ ...product, category });

  return {
    id: product._id || product.id,
    _id: product._id || product.id,
    name: product.name,
    title: product.name,
    slug: product.slug || slugify(product.name),
    price: product.price,
    description,
    collection,
    category,
    categoryLabel: category,
    colors: product.colors || [],
    images,
    image: images[0] || '',
    sizes: getAllSizeKeys(product.sizes || [], sizeStock),
    stock,
    totalStock: stock,
    sizeStock,
    badges: product.badges || [],
    material: product.material || '',
    fabric: product.fabric || '',
    fit: product.fit || '',
    careInstructions: product.careInstructions || '',
    countryOfOrigin: product.countryOfOrigin || '',
    metaTitle: product.metaTitle || '',
    metaDescription: looksLikePlaceholderCopy(product.metaDescription) ? description : product.metaDescription,
    metaKeywords: product.metaKeywords || [],
    rating: toNumber(product.rating, 0),
    reviewCount: Math.max(0, Math.trunc(toNumber(product.reviewCount, 0))),
    reviews: Array.isArray(product.reviews) ? product.reviews : [],
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
};

const collectionProductSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  collection: true,
  category: true,
  colors: true,
  images: true,
  sizes: true,
  sizeStock: true,
  stock: true,
  badges: true,
  createdAt: true,
  updatedAt: true
};

const toCollectionListProduct = (product) => {
  const normalized = normalizeProduct(product);
  return {
    id: normalized.id,
    _id: normalized._id,
    name: normalized.name,
    slug: normalized.slug,
    price: normalized.price,
    collection: normalized.collection,
    category: normalized.category,
    categoryLabel: normalized.categoryLabel,
    colors: normalized.colors,
    images: normalized.images,
    image: normalized.image,
    sizes: normalized.sizes,
    sizeStock: normalized.sizeStock,
    stock: normalized.stock,
    totalStock: normalized.totalStock,
    badges: normalized.badges
  };
};

const productSearchText = (product) =>
  [
    product.name,
    product.slug,
    product.collection,
    product.category,
    product.description,
    ...(product.badges || []),
    product.material,
    product.fabric,
    product.fit
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const buildProductFilter = ({ collection, category, q } = {}) => {
  const normalizedCollection = normalizeCollection(collection, 'men');
  const normalizedCategory = category ? normalizeCategory(normalizedCollection, category, '') : '';

  return {
    collection: normalizedCollection,
    category: normalizedCategory,
    q: sanitizeText(q)
  };
};

const getQueryLimit = (value) => {
  const limit = Math.trunc(toNumber(value, 0));
  if (limit <= 0) return null;
  return Math.min(limit, 50);
};

const getEffectiveProductLimit = (req, collectionView) => {
  const requested = getQueryLimit(req.query.limit || req.query.take);
  if (requested) return requested;
  if (collectionView || !req.headers.authorization) return 50;
  return null;
};

const productMatches = (product, filter) => {
  if (filter.collection && normalizeCollection(product.collection, 'men') !== filter.collection) return false;
  if (filter.category && normalizeCategory('men', product.category, getDefaultCollectionCategory('men')) !== filter.category) return false;
  if (filter.q && !productSearchText(product).includes(filter.q.toLowerCase())) return false;
  return true;
};

const logProductQuery = (source, filter, count, sample = null) => {
  if (process.env.NODE_ENV === 'production') return;
  console.log('[products:get]', {
    source,
    filter,
    count,
    sample: sample
      ? {
          id: sample.id || sample._id,
          collection: sample.collection,
          category: sample.category
        }
      : null
  });
};

const getProducts = async (req, res) => {
  try {
    const filter = buildProductFilter(req.query);
    const collectionView = req.query.view === 'collection';

    if (global.useMemoryStore) {
      seedProducts();
      const products = store.products.filter((product) => productMatches(product, filter));
      const limitedProducts = getQueryLimit(req.query.limit || req.query.take) ? products.slice(0, getQueryLimit(req.query.limit || req.query.take)) : products;
      logProductQuery('memory', filter, limitedProducts.length, limitedProducts[0]);
      return res.json(limitedProducts.map(collectionView ? toCollectionListProduct : normalizeProduct));
    }

    const where = {};

    if (filter.collection) {
      where.collection = filter.collection;
    }

    if (filter.category) {
      where.category = filter.category;
    }

    if (filter.q) {
      where.OR = [
        { name: { contains: filter.q, mode: 'insensitive' } },
        { slug: { contains: filter.q, mode: 'insensitive' } },
        { collection: { contains: filter.q, mode: 'insensitive' } },
        { category: { contains: filter.q, mode: 'insensitive' } },
        ...(collectionView ? [] : [{ description: { contains: filter.q, mode: 'insensitive' } }])
      ];
    }

    const query = { where, orderBy: { createdAt: 'desc' } };
    const limit = getEffectiveProductLimit(req, collectionView);
    if (limit) {
      query.take = limit;
    }
    if (collectionView) {
      query.select = collectionProductSelect;
    }

    const products = await prisma.product.findMany(query);
    const filteredProducts = filter.q ? products.filter((product) => productMatches(product, filter)) : products;
    logProductQuery('prisma', filter, filteredProducts.length, filteredProducts[0]);
    res.json(filteredProducts.map(collectionView ? toCollectionListProduct : normalizeProduct));
  } catch (error) {
     console.error(error);
     res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      seedProducts();
      const product = store.products.find((entry) => (
        entry._id === req.params.id ||
        entry.id === req.params.id ||
        entry.slug === req.params.id ||
        slugify(entry.name) === req.params.id
      ));
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.json(normalizeProduct(product));
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { slug: req.params.id }
        ]
      }
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(normalizeProduct(product));
  } catch (error) {
     console.error(error);
     res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  const uploadedImages = getUploadedProductImages(req);
  try {
    const payload = sanitizeProductPayload({ ...req.body, uploadedImages });
    if (global.useMemoryStore) {
      if (payload.slug && store.products.some((entry) => entry.slug === payload.slug)) {
        payload.slug = `${payload.slug}-${Date.now().toString(36)}`;
      }
      const product = {
        _id: createId(),
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      store.products.unshift(product);
      return res.status(201).json(normalizeProduct(product));
    }

    if (payload.slug) {
      const existingSlug = await prisma.product.findUnique({ where: { slug: payload.slug } });
      if (existingSlug) {
        payload.slug = `${payload.slug}-${Date.now().toString(36)}`;
      }
    }
    const product = await prisma.product.create({ data: payload });
    res.status(201).json(normalizeProduct(product));
  } catch (error) {
    deleteProductImageFiles(uploadedImages);
    console.error(error);
      res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  const uploadedImages = getUploadedProductImages(req);
  try {
    if (global.useMemoryStore) {
      const index = store.products.findIndex((entry) => entry._id === req.params.id);
      if (index === -1) {
        deleteProductImageFiles(uploadedImages);
        return res.status(404).json({ message: 'Product not found' });
      }
      const payload = sanitizeProductPayload({ ...req.body, uploadedImages }, store.products[index]);
      if (payload.slug && store.products.some((entry, entryIndex) => entryIndex !== index && entry.slug === payload.slug)) {
        payload.slug = `${payload.slug}-${Date.now().toString(36)}`;
      }
      const previousImages = store.products[index].images || [];
      store.products[index] = { ...store.products[index], ...payload, updatedAt: new Date() };
      deleteRemovedProductImages(previousImages, store.products[index].images);
      return res.json(normalizeProduct(store.products[index]));
    }

    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      deleteProductImageFiles(uploadedImages);
      return res.status(404).json({ message: 'Product not found' });
    }

    const payload = sanitizeProductPayload({ ...req.body, uploadedImages }, existing);
    if (payload.slug) {
      const existingSlug = await prisma.product.findUnique({ where: { slug: payload.slug } });
      if (existingSlug && existingSlug.id !== req.params.id) {
        payload.slug = `${payload.slug}-${Date.now().toString(36)}`;
      }
    }
    const product = await prisma.product.update({ where: { id: req.params.id }, data: payload });
    if (!product) {
      deleteProductImageFiles(uploadedImages);
      return res.status(404).json({ message: 'Product not found' });
    }
    deleteRemovedProductImages(existing.images, product.images);
    res.json(normalizeProduct(product));
  } catch (error) {
    deleteProductImageFiles(uploadedImages);
    console.error(error);
      res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const index = store.products.findIndex((entry) => entry._id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ message: 'Product not found' });
      }
      const [removedProduct] = store.products.splice(index, 1);
      deleteProductImageFiles(removedProduct?.images || []);
      return res.json({ message: 'Product deleted' });
    }

    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await prisma.product.delete({ where: { id: req.params.id } });
    deleteProductImageFiles(product.images || []);
    res.json({ message: 'Product deleted' });
  } catch (error) {
     console.error(error);
     res.status(500).json({ message: error.message });
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
      console.error(error);
      res.status(500).json({ message: error.message });
  }
};

const getInventoryDashboard = async (req, res) => {
  try {
    const { name, sku, collection, category, lowStockOnly, outOfStockOnly, sortBy } = req.query;
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
      collection,
      category,
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
      filters: { name: name || '', sku: sku || '', collection: collection || '', category: category || '', lowStockOnly: String(lowStockOnly) === 'true', outOfStockOnly: String(outOfStockOnly) === 'true', sortBy: sortBy || 'recent' },
      items: sorted,
      count: sorted.length,
      lowStockList,
      insights
    });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
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
      console.error(error);
      res.status(500).json({ message: error.message });
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
