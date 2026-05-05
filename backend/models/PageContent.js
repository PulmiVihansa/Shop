const mongoose = require('mongoose');

const pageContentSchema = new mongoose.Schema(
  {
    pageName: { type: String, required: true, unique: true, lowercase: true, trim: true },
    content: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PageContent', pageContentSchema);
