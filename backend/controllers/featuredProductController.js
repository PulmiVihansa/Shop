const prisma = require('../config/prisma');
const { store, createId, seedProducts } = require('../data/memoryStore');
const { withId } = require('../utils/dbFormat');

const featuredProductSelect = {
  id: true,
  name: true,
  price: true,
  description: true,
  category: true,
  colors: true,
  images: true,
  sizes: true,
};

const serializeFeatured = (entry, index = 0) => {
  const product = entry.product || {};
  const image = product.images?.[0] || product.image || '';
  return {
    ...withId(entry),
    product: product.id || product._id ? withId(product) : product,
    productId: entry.productId || product.id || product._id,
    name: product.name || '',
    productName: product.name || '',
    price: Number(product.price || 0),
    description: product.description || '',
    category: product.category || '',
    sizes: product.sizes || [],
    colors: product.colors || [],
    image,
    images: product.images || (image ? [image] : []),
    stackImage: image,
    featureImage: image,
    displayOrder: Number(entry.displayOrder ?? index),
    isActive: Boolean(entry.isActive),
  };
};

const getFeaturedProducts = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      seedProducts();
      const featured = (store.featuredProducts || [])
        .map((entry) => ({
          ...entry,
          product: store.products.find((product) => (product.id || product._id) === entry.productId),
        }))
        .filter((entry) => entry.isActive && entry.product)
        .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
        .slice(0, 5);
      return res.json(featured.map(serializeFeatured));
    }

    const featured = await prisma.featuredProduct.findMany({
      where: { isActive: true },
      include: { product: { select: featuredProductSelect } },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      take: 5,
    });
    return res.json(featured.map(serializeFeatured));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminFeaturedProducts = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      seedProducts();
      const featured = (store.featuredProducts || [])
        .map((entry) => ({
          ...entry,
          product: store.products.find((product) => (product.id || product._id) === entry.productId),
        }))
        .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
      return res.json(featured.map(serializeFeatured));
    }

    const featured = await prisma.featuredProduct.findMany({
      include: { product: { select: featuredProductSelect } },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return res.json(featured.map(serializeFeatured));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const sanitizeFeaturedPayload = (body = {}, existing = null) => ({
  productId: String(body.productId || existing?.productId || '').trim(),
  displayOrder: Math.max(0, Math.trunc(Number(body.displayOrder ?? existing?.displayOrder ?? 0))),
  isActive: body.isActive === undefined ? Boolean(existing?.isActive ?? true) : Boolean(body.isActive),
});

const saveFeaturedProduct = async (req, res) => {
  try {
    const payload = sanitizeFeaturedPayload(req.body);
    if (!payload.productId) {
      return res.status(400).json({ success: false, message: 'Product is required' });
    }

    if (global.useMemoryStore) {
      seedProducts();
      const product = store.products.find((entry) => (entry.id || entry._id) === payload.productId);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      store.featuredProducts = store.featuredProducts || [];
      const existingIndex = store.featuredProducts.findIndex((entry) => entry.productId === payload.productId);
      if (existingIndex >= 0) {
        store.featuredProducts[existingIndex] = { ...store.featuredProducts[existingIndex], ...payload };
        return res.json(serializeFeatured({ ...store.featuredProducts[existingIndex], product }));
      }
      const entry = { id: createId(), ...payload, createdAt: new Date(), product };
      store.featuredProducts.push(entry);
      return res.status(201).json(serializeFeatured(entry));
    }

    const product = await prisma.product.findUnique({ where: { id: payload.productId } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const featured = await prisma.featuredProduct.upsert({
      where: { productId: payload.productId },
      update: {
        displayOrder: payload.displayOrder,
        isActive: payload.isActive,
      },
      create: payload,
      include: { product: { select: featuredProductSelect } },
    });
    return res.status(201).json(serializeFeatured(featured));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateFeaturedProduct = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const index = (store.featuredProducts || []).findIndex((entry) => entry.id === req.params.id || entry._id === req.params.id);
      if (index === -1) return res.status(404).json({ success: false, message: 'Featured product not found' });
      const payload = sanitizeFeaturedPayload(req.body, store.featuredProducts[index]);
      store.featuredProducts[index] = { ...store.featuredProducts[index], ...payload };
      const product = store.products.find((entry) => (entry.id || entry._id) === payload.productId);
      return res.json(serializeFeatured({ ...store.featuredProducts[index], product }));
    }

    const existing = await prisma.featuredProduct.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Featured product not found' });
    const payload = sanitizeFeaturedPayload(req.body, existing);
    const featured = await prisma.featuredProduct.update({
      where: { id: req.params.id },
      data: payload,
      include: { product: { select: featuredProductSelect } },
    });
    return res.json(serializeFeatured(featured));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteFeaturedProduct = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      store.featuredProducts = (store.featuredProducts || []).filter((entry) => entry.id !== req.params.id && entry._id !== req.params.id);
      return res.json({ success: true, message: 'Featured product removed' });
    }

    await prisma.featuredProduct.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Featured product removed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFeaturedProducts,
  getAdminFeaturedProducts,
  saveFeaturedProduct,
  updateFeaturedProduct,
  deleteFeaturedProduct,
};
