const {
  paymentRequiredMessage,
  findActiveVoucher,
  findVoucherByOrderId,
  getAllGiftVoucherSales,
  getVoucherPdf,
  sendVoucherPurchaseEmails,
} = require('../services/giftVoucherService');

const canAccessVoucher = (req, voucher) => {
  if (!voucher) return false;
  if (req.user?.role === 'admin') return true;
  return [voucher.senderEmail, voucher.recipientEmail].filter(Boolean).includes(req.user?.email);
};

const downloadVoucherPdf = async (req, res) => {
  try {
    const voucher = await findActiveVoucher({
      id: req.params.id || req.body.id,
      voucherCode: req.body.voucherCode || req.query.voucherCode,
    });
    if (!voucher) return res.status(400).json({ message: paymentRequiredMessage });
    if (!canAccessVoucher(req, voucher)) return res.status(403).json({ message: 'You do not have access to this voucher.' });
    const pdf = await getVoucherPdf(voucher);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Astravia-${voucher.voucherCode}.pdf"`);
    return res.send(pdf);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to generate gift voucher PDF', error: error.message });
  }
};

const emailVoucher = async (req, res) => {
  try {
    const voucher = await findActiveVoucher({
      id: req.params.id || req.body.id,
      voucherCode: req.body.voucherCode || req.query.voucherCode,
    });
    if (!voucher) return res.status(400).json({ message: paymentRequiredMessage });
    if (!canAccessVoucher(req, voucher)) return res.status(403).json({ message: 'You do not have access to this voucher.' });
    const pdf = await getVoucherPdf(voucher);
    const result = await sendVoucherPurchaseEmails({ voucher, pdfBuffer: pdf });
    return res.json({ message: 'Gift voucher email sent', ...result });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to email gift voucher', error: error.message });
  }
};

const getVoucherByOrder = async (req, res) => {
  try {
    const voucher = await findVoucherByOrderId(req.params.orderId);
    if (!voucher) return res.status(404).json({ message: paymentRequiredMessage });
    if (!canAccessVoucher(req, voucher)) return res.status(403).json({ message: 'You do not have access to this voucher.' });
    return res.json(voucher);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to fetch gift voucher', error: error.message });
  }
};

const getAdminGiftVoucherSales = async (req, res) => {
  try {
    const vouchers = await getAllGiftVoucherSales();
    return res.json(vouchers);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch gift voucher sales', error: error.message });
  }
};

module.exports = {
  downloadVoucherPdf,
  emailVoucher,
  getVoucherByOrder,
  getAdminGiftVoucherSales,
};
