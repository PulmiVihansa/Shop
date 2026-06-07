const {
  emailInvoice,
  generateInvoiceForOrder,
  getExistingInvoicePdf,
  getInvoiceById,
  getInvoiceDashboard,
} = require('../services/invoiceService');
const { sendAdminEmpty, sendAdminObject } = require('../utils/adminApiResponse');

const getInvoices = async (req, res) => {
  const endpoint = 'GET /api/invoices';
  try {
    const dashboard = await getInvoiceDashboard(req.query);
    return sendAdminObject(res, endpoint, dashboard, {
      invoices: dashboard.invoices || [],
      summary: dashboard.summary || [],
      pagination: dashboard.pagination || {},
    });
  } catch (error) {
    return sendAdminEmpty(res, endpoint, error, []);
  }
};

const getInvoice = async (req, res) => {
  try {
    const invoice = await getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invoice', error: error.message });
  }
};

const generateInvoice = async (req, res) => {
  try {
    const orderId = req.body.orderId || req.body.order_id;
    if (!orderId) return res.status(400).json({ message: 'Order ID is required' });

    const invoice = await generateInvoiceForOrder(orderId, {
      paymentMethod: req.body.paymentMethod,
      paymentStatus: req.body.paymentStatus,
      sendEmail: req.body.sendEmail !== false,
      discount: req.body.discount,
      tax: req.body.tax,
    });
    if (!invoice) return res.status(404).json({ message: 'Order not found' });
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ message: 'Failed to generate invoice', error: error.message });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    const pdf = await getExistingInvoicePdf(req.params.id);
    if (!pdf) return res.status(404).json({ message: 'Invoice not found' });
    if (pdf.missing) {
      return res.status(404).json({ message: 'Invoice PDF has not been generated yet' });
    }

    res.download(pdf.filePath, `${pdf.invoice.invoiceId}.pdf`);
  } catch (error) {
    res.status(500).json({ message: 'Failed to download invoice PDF', error: error.message });
  }
};

const sendInvoice = async (req, res) => {
  try {
    const result = await emailInvoice(req.params.id, {
      to: req.body.to || req.body.customerEmail,
      subject: req.body.subject,
      message: req.body.message,
    });
    if (!result) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Invoice emailed successfully.', ...result });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to send invoice email' });
  }
};

module.exports = {
  downloadInvoice,
  generateInvoice,
  getInvoice,
  getInvoices,
  sendInvoice,
};
