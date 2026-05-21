const prisma = require('../config/prisma');
const { store } = require('../data/memoryStore');
const { withId } = require('../utils/dbFormat');

const getSettings = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      return res.json(store.siteSettings);
    }

    const existing = await prisma.siteSettings.findFirst();
    const settings = existing || await prisma.siteSettings.create({ data: {} });
    res.json(withId(settings));
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

    const existing = await prisma.siteSettings.findFirst();
    const setting = existing
      ? await prisma.siteSettings.update({ where: { id: existing.id }, data: settings })
      : await prisma.siteSettings.create({ data: settings });
    res.json(withId(setting));
  } catch (error) {
    res.status(400).json({ message: 'Failed to update settings', error: error.message });
  }
};

module.exports = { getSettings, updateSettings };
