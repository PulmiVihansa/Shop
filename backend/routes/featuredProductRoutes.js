const express = require('express');
const {
  getFeaturedProducts,
  getAdminFeaturedProducts,
  saveFeaturedProduct,
  updateFeaturedProduct,
  deleteFeaturedProduct,
} = require('../controllers/featuredProductController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getFeaturedProducts);
router.get('/admin', authMiddleware, adminMiddleware, getAdminFeaturedProducts);
router.post('/', authMiddleware, adminMiddleware, saveFeaturedProduct);
router.put('/:id', authMiddleware, adminMiddleware, updateFeaturedProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteFeaturedProduct);

module.exports = router;
