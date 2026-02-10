const mongoose = require('mongoose');

// Product schema for catalog items.
const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    category: { type: String, required: true, trim: true },
    image: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
