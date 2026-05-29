const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
  getInventoryDashboard,
  updateProductStock
} = require('../controllers/productController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Product routes.
const router = express.Router();

router.get('/', getProducts);
router.get('/inventory/dashboard', authMiddleware, adminMiddleware, getInventoryDashboard);
router.get('/:id', getProductById);
router.post('/', authMiddleware, adminMiddleware, createProduct);
router.put('/:id', authMiddleware, adminMiddleware, updateProduct);
router.put('/:id/restock', authMiddleware, adminMiddleware, restockProduct);
router.put('/:id/stock', authMiddleware, adminMiddleware, updateProductStock);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

module.exports = router;
