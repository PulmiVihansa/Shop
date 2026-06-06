const prisma = require('../config/prisma');
const { withId } = require('../utils/dbFormat');

/**
 * Retrieve a setting by key. Returns defaultValue if not found.
 */
const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    if (!key) return res.status(400).json({ message: 'Setting key is required' });

    if (global.useMemoryStore) {
      const setting = (store.settings && store.settings[key]) || null;
      return res.json({ key, value: setting || null });
    }

    const setting = await prisma.setting.findUnique({ where: { key } });
    if (!setting) {
      return res.json({ key, value: null });
    }
    return res.json(withId(setting));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Upsert a setting key/value pair.
 * Expected body: { key: string, value: any }
 */
const saveSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ message: 'Setting key is required' });

    if (global.useMemoryStore) {
      store.settings = store.settings || {};
      store.settings[key] = value;
      return res.json({ key, value });
    }

    const upserted = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    return res.json(withId(upserted));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSetting, saveSetting };
