const Setting = require('../models/Setting');
const SiteSettings = require('../models/SiteSettings');
const { store } = require('../data/memoryStore');

const getSettings = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      return res.json(store.siteSettings);
    }

    const settings = await SiteSettings.findOneAndUpdate({}, { $setOnInsert: {} }, { new: true, upsert: true });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const settings = {
      storeName: req.body.storeName || 'ATELIER',
      logoUrl: req.body.logoUrl || '',
      whatsappNumber: String(req.body.whatsappNumber || '').replace(/[^\d]/g, ''),
      currency: req.body.currency || 'LKR',
      contactEmail: req.body.contactEmail || '',
    };

    if (global.useMemoryStore) {
      store.siteSettings = { ...store.siteSettings, ...settings, updatedAt: new Date() };
      store.settings.whatsappNumber = settings.whatsappNumber;
      return res.json(store.siteSettings);
    }

    const setting = await SiteSettings.findOneAndUpdate({}, settings, { new: true, upsert: true });
    res.json(setting);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update settings', error: error.message });
  }
};

module.exports = { getSettings, updateSettings };
