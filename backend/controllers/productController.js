const prisma = require('../config/prisma');
const { store, createId, seedProducts } = require('../data/memoryStore');

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
  placements: product.placements || [],
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
  if (filter.placement) {
    const placements = Array.isArray(product.placements) ? product.placements : [];
    if (placements.length > 0 && !placements.includes(filter.placement)) return false;
  }
  if (filter.q && !product.name.toLowerCase().includes(filter.q.toLowerCase())) return false;
  return true;
};

const getProducts = async (req, res) => {
  try {
    const { category, tag, q, placement } = req.query;

    if (global.useMemoryStore) {
      seedProducts();
      const products = store.products.filter((product) => productMatches(product, { category, tag, q, placement }));
      return res.json(products.map(normalizeProduct));
    }

    const where = {};

    if (category) where.category = category;
    if (tag) where.tags = { has: tag };
    if (placement) {
      where.OR = [
        { placements: { has: placement } },
        { placements: { isEmpty: true } },
      ];
    }
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
    if (global.useMemoryStore) {
      const product = {
        _id: createId(),
        images: [],
        sizes: [],
        tags: [],
        placements: [],
        swatches: [],
        stock: 0,
        sizeStock: { S: 0, M: 0, L: 0, XL: 0 },
        bgClass: 'b1',
        imageClass: 'linen',
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      store.products.unshift(product);
      return res.status(201).json(normalizeProduct(product));
    }

    const product = await prisma.product.create({ data: req.body });
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
      store.products[index] = { ...store.products[index], ...req.body, updatedAt: new Date() };
      return res.json(normalizeProduct(store.products[index]));
    }

    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
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
      product.sizeStock = product.sizeStock || { S: 0, M: 0, L: 0, XL: 0 };
      if (size && product.sizeStock[size] !== undefined) {
        product.sizeStock[size] = Number(product.sizeStock[size] || 0) + quantity;
      } else if (sizeStock) {
        product.sizeStock = { ...product.sizeStock, ...sizeStock };
      }
      product.stock = Object.values(product.sizeStock).reduce((sum, value) => sum + Number(value || 0), 0);
      product.updatedAt = new Date();
      return res.json(normalizeProduct(product));
    }

    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Product not found' });

    const nextSizeStock = { ...(existing.sizeStock || {}) };
    let nextStock = Number(existing.stock || 0);
    if (size && nextSizeStock[size] !== undefined) {
      nextSizeStock[size] = Number(nextSizeStock[size] || 0) + quantity;
      nextStock += quantity;
    } else if (sizeStock) {
      Object.assign(nextSizeStock, sizeStock);
      nextStock = Object.values(nextSizeStock).reduce((sum, value) => sum + Number(value || 0), 0);
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

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, restockProduct };
