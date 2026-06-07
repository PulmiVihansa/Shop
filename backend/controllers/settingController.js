const prisma = require('../config/prisma');
const { store } = require('../data/memoryStore');
const { withId } = require('../utils/dbFormat');
const { sendAdminEmpty, sendAdminObject } = require('../utils/adminApiResponse');

const getSettings = async (req, res) => {
  const endpoint = 'GET /api/settings';
  try {
    if (global.useMemoryStore) {
      return sendAdminObject(res, endpoint, store.siteSettings);
    }

    const existing = await prisma.siteSettings.findFirst();
    const settings = existing || await prisma.siteSettings.create({ data: {} });
    return sendAdminObject(res, endpoint, withId(settings));
  } catch (error) {
    return sendAdminEmpty(res, endpoint, error);
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
