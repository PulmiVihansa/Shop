const express = require('express');
const {
  getSales,
  getAdminSales,
  createSale,
  updateSale,
  deleteSale,
} = require('../controllers/salesController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getSales);
router.get('/admin', authMiddleware, adminMiddleware, getAdminSales);
router.post('/', authMiddleware, adminMiddleware, createSale);
router.put('/:id', authMiddleware, adminMiddleware, updateSale);
router.delete('/:id', authMiddleware, adminMiddleware, deleteSale);

module.exports = router;
