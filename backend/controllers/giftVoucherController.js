const { normalizeVoucher, renderVoucherPdf, sendVoucherEmail } = require('../services/giftVoucherService');

const downloadVoucherPdf = async (req, res) => {
  try {
    const voucher = normalizeVoucher(req.body);
    const pdf = await renderVoucherPdf(voucher);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Astravia-${voucher.code}.pdf"`);
    return res.send(pdf);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to generate gift voucher PDF', error: error.message });
  }
};

const emailVoucher = async (req, res) => {
  try {
    const result = await sendVoucherEmail(req.body);
    return res.json({ message: 'Gift voucher email sent', ...result });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to email gift voucher', error: error.message });
  }
};

module.exports = {
  downloadVoucherPdf,
  emailVoucher,
};
