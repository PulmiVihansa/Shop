const mongoose = require('mongoose');

const homepageContentSchema = new mongoose.Schema(
  {
    heroTitle: { type: String, default: '' },
    heroSubtitle: { type: String, default: '' },
    heroImage: { type: String, default: '' },
    heroImageSecondary: { type: String, default: '' },
    buttonText: { type: String, default: '' },
    buttonLink: { type: String, default: '' },
    section2Title: { type: String, default: '' },
    section2Image: { type: String, default: '' },
    featuredCategories: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('HomepageContent', homepageContentSchema);
