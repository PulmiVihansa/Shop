const mongoose = require('mongoose');

const paymentSettingsSchema = new mongoose.Schema(
  {
    paymentProvider: { type: String, default: 'PayHere' },
    merchantId: { type: String, default: '' },
    merchantSecret: { type: String, default: '' },
    currency: { type: String, default: 'LKR' },
    enableCOD: { type: Boolean, default: true },
    enableOnlinePayment: { type: Boolean, default: false },
    whatsappNumber: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema);
