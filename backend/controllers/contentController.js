const prisma = require('../config/prisma');
const { store, createId } = require('../data/memoryStore');
const { withId } = require('../utils/dbFormat');

const getHomepageContent = async (req, res) => {
  try {
    if (global.useMemoryStore) return res.json(store.homepageContent);
    const existing = await prisma.homepageContent.findFirst();
    const content = existing || await prisma.homepageContent.create({ data: {} });
    res.json(withId(content));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch homepage content', error: error.message });
  }
};

const updateHomepageContent = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      store.homepageContent = { ...store.homepageContent, ...req.body, updatedAt: new Date() };
      return res.json(store.homepageContent);
    }
    const existing = await prisma.homepageContent.findFirst();
    const content = existing
      ? await prisma.homepageContent.update({ where: { id: existing.id }, data: req.body })
      : await prisma.homepageContent.create({ data: req.body });
    res.json(withId(content));
  } catch (error) {
    res.status(400).json({ message: 'Failed to update homepage content', error: error.message });
  }
};

const getBanners = async (req, res) => {
  try {
    if (global.useMemoryStore) return res.json(store.banners);
    const banners = await prisma.banner.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(banners.map(withId));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch banners', error: error.message });
  }
};

const createBanner = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const banner = { _id: createId(), isActive: true, ...req.body, createdAt: new Date(), updatedAt: new Date() };
      store.banners.unshift(banner);
      return res.status(201).json(banner);
    }
    const banner = await prisma.banner.create({ data: req.body });
    res.status(201).json(withId(banner));
  } catch (error) {
    res.status(400).json({ message: 'Failed to create banner', error: error.message });
  }
};

const updateBanner = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const index = store.banners.findIndex((banner) => banner._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Banner not found' });
      store.banners[index] = { ...store.banners[index], ...req.body, updatedAt: new Date() };
      return res.json(store.banners[index]);
    }
    const existing = await prisma.banner.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Banner not found' });
    const banner = await prisma.banner.update({ where: { id: req.params.id }, data: req.body });
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.json(withId(banner));
  } catch (error) {
    res.status(400).json({ message: 'Failed to update banner', error: error.message });
  }
};

const deleteBanner = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const index = store.banners.findIndex((banner) => banner._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Banner not found' });
      store.banners.splice(index, 1);
      return res.json({ message: 'Banner deleted' });
    }
    const banner = await prisma.banner.findUnique({ where: { id: req.params.id } });
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    await prisma.banner.delete({ where: { id: req.params.id } });
    res.json({ message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete banner', error: error.message });
  }
};

const getPageContent = async (req, res) => {
  try {
    const pageName = req.params.pageName.toLowerCase();
    if (global.useMemoryStore) {
      return res.json(store.pageContents.find((page) => page.pageName === pageName) || { pageName, content: '' });
    }
    const page = await prisma.pageContent.upsert({
      where: { pageName },
      update: {},
      create: { pageName }
    });
    res.json(withId(page));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch page content', error: error.message });
  }
};

const updatePageContent = async (req, res) => {
  try {
    const pageName = req.params.pageName.toLowerCase();
    if (global.useMemoryStore) {
      const existing = store.pageContents.find((page) => page.pageName === pageName);
      if (existing) {
        existing.content = req.body.content || '';
        existing.updatedAt = new Date();
        return res.json(existing);
      }
      const page = { _id: createId(), pageName, content: req.body.content || '', createdAt: new Date(), updatedAt: new Date() };
      store.pageContents.push(page);
      return res.json(page);
    }
    const page = await prisma.pageContent.upsert({
      where: { pageName },
      update: { content: req.body.content || '' },
      create: { pageName, content: req.body.content || '' }
    });
    res.json(withId(page));
  } catch (error) {
    res.status(400).json({ message: 'Failed to update page content', error: error.message });
  }
};

const uploadImage = async (req, res) => {
  const { image, imageUrl } = req.body;
  if (!image && !imageUrl) {
    return res.status(400).json({ message: 'Image file or URL is required' });
  }
  res.json({ url: imageUrl || image });
};

module.exports = {
  getHomepageContent,
  updateHomepageContent,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getPageContent,
  updatePageContent,
  uploadImage
};
