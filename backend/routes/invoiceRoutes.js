const express = require('express');
const {
  downloadInvoice,
  generateInvoice,
  getInvoice,
  getInvoices,
  sendInvoice,
} = require('../controllers/invoiceController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/generate', authMiddleware, adminMiddleware, generateInvoice);
router.get('/', authMiddleware, adminMiddleware, getInvoices);
router.get('/download/:id', authMiddleware, adminMiddleware, downloadInvoice);
router.post('/send-email/:id', authMiddleware, adminMiddleware, sendInvoice);
router.get('/:id/pdf', authMiddleware, adminMiddleware, downloadInvoice);
router.get('/:id', authMiddleware, adminMiddleware, getInvoice);

module.exports = router;
