const prisma = require('../config/prisma');
const { store } = require('../data/memoryStore');
const { withId } = require('../utils/dbFormat');

const sanitize = (settings) => ({
  paymentProvider: settings.paymentProvider || 'PayHere',
  merchantId: settings.merchantId || '',
  currency: settings.currency || 'LKR',
  enableCOD: Boolean(settings.enableCOD),
  enableOnlinePayment: Boolean(settings.enableOnlinePayment),
  whatsappNumber: settings.whatsappNumber || '',
  hasMerchantSecret: Boolean(settings.merchantSecret),
  updatedAt: settings.updatedAt
});

const getPaymentSettingsDoc = async () => {
  if (global.useMemoryStore) {
    return store.paymentSettings;
  }

  const fallback = {
    paymentProvider: process.env.PAYMENT_PROVIDER || 'PayHere',
    merchantId: process.env.PAYHERE_MERCHANT_ID || '',
    merchantSecret: process.env.PAYHERE_MERCHANT_SECRET || '',
    currency: process.env.PAYMENT_CURRENCY || 'LKR',
    enableCOD: process.env.ENABLE_COD !== 'false',
    enableOnlinePayment: process.env.ENABLE_ONLINE_PAYMENT === 'true',
    whatsappNumber: process.env.STORE_WHATSAPP || ''
  };

  const existing = await prisma.paymentSettings.findFirst();
  return existing || prisma.paymentSettings.create({ data: fallback });
};

const getPaymentSettings = async (req, res) => {
  try {
    const settings = await getPaymentSettingsDoc();
    res.json(sanitize(settings));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payment settings', error: error.message });
  }
};

const updatePaymentSettings = async (req, res) => {
  try {
    const payload = {
      paymentProvider: req.body.paymentProvider || 'PayHere',
      merchantId: String(req.body.merchantId || '').trim(),
      currency: String(req.body.currency || 'LKR').trim().toUpperCase(),
      enableCOD: Boolean(req.body.enableCOD),
      enableOnlinePayment: Boolean(req.body.enableOnlinePayment),
      whatsappNumber: String(req.body.whatsappNumber || '').replace(/[^\d]/g, '')
    };

    if (req.body.merchantSecret) {
      payload.merchantSecret = String(req.body.merchantSecret).trim();
    }

    if (!payload.enableCOD && !payload.enableOnlinePayment) {
      return res.status(400).json({ message: 'At least one payment method must be enabled' });
    }

    if (global.useMemoryStore) {
      store.paymentSettings = { ...store.paymentSettings, ...payload, updatedAt: new Date() };
      store.settings.whatsappNumber = payload.whatsappNumber;
      return res.json(sanitize(store.paymentSettings));
    }

    const existing = await prisma.paymentSettings.findFirst();
    const settings = existing
      ? await prisma.paymentSettings.update({ where: { id: existing.id }, data: payload })
      : await prisma.paymentSettings.create({ data: payload });
    res.json(sanitize(withId(settings)));
  } catch (error) {
    res.status(400).json({ message: 'Failed to update payment settings', error: error.message });
  }
};

module.exports = { getPaymentSettingsDoc, getPaymentSettings, updatePaymentSettings };
