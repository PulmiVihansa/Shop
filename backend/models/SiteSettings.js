const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: 'ATELIER' },
    logoUrl: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' },
    currency: { type: String, default: 'LKR' },
    contactEmail: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
