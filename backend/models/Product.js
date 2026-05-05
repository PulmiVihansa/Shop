const mongoose = require('mongoose');

// Product schema for catalog items.
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    description: { type: String, default: '' },
    category: { type: String, required: true, trim: true },
    images: [{ type: String }],
    sizes: [{ type: String }],
    stock: { type: Number, default: 0 },
    sizeStock: {
      S: { type: Number, default: 0 },
      M: { type: Number, default: 0 },
      L: { type: Number, default: 0 },
      XL: { type: Number, default: 0 }
    },
    tags: [{ type: String }],
    badge: { type: String, default: '' },
    badgeText: { type: String, default: '' },
    bgClass: { type: String, default: 'b1' },
    swatches: [{ type: String }],
    imageClass: { type: String, default: 'linen' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
