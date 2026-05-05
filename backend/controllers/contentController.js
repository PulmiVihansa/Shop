const HomepageContent = require('../models/HomepageContent');
const Banner = require('../models/Banner');
const PageContent = require('../models/PageContent');
const { store, createId } = require('../data/memoryStore');

const getHomepageContent = async (req, res) => {
  try {
    if (global.useMemoryStore) return res.json(store.homepageContent);
    const content = await HomepageContent.findOneAndUpdate({}, { $setOnInsert: {} }, { new: true, upsert: true });
    res.json(content);
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
    const content = await HomepageContent.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(content);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update homepage content', error: error.message });
  }
};

const getBanners = async (req, res) => {
  try {
    if (global.useMemoryStore) return res.json(store.banners);
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json(banners);
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
    const banner = await Banner.create(req.body);
    res.status(201).json(banner);
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
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.json(banner);
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
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
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
    const page = await PageContent.findOneAndUpdate({ pageName }, { $setOnInsert: { pageName } }, { new: true, upsert: true });
    res.json(page);
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
    const page = await PageContent.findOneAndUpdate(
      { pageName },
      { pageName, content: req.body.content || '' },
      { new: true, upsert: true }
    );
    res.json(page);
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
