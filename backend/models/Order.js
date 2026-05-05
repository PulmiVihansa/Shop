const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    size: { type: String, default: 'One Size' },
    imageClass: { type: String, default: '' }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    totalPrice: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['COD', 'ONLINE'], default: 'ONLINE' },
    paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
    transactionId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    payment: {
      method: { type: String, enum: ['card', 'bank', 'cod'], default: 'card' },
      status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
      reference: { type: String, default: '' },
      paidAt: { type: Date }
    },
    address: {
      fullName: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String, default: '' },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
