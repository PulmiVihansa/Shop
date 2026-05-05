const express = require('express');
const {
  getHomepageContent,
  updateHomepageContent,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getPageContent,
  updatePageContent,
  uploadImage
} = require('../controllers/contentController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/homepage', getHomepageContent);
router.put('/homepage', authMiddleware, adminMiddleware, updateHomepageContent);
router.get('/banners', getBanners);
router.post('/banners', authMiddleware, adminMiddleware, createBanner);
router.put('/banners/:id', authMiddleware, adminMiddleware, updateBanner);
router.delete('/banners/:id', authMiddleware, adminMiddleware, deleteBanner);
router.get('/page/:pageName', getPageContent);
router.put('/page/:pageName', authMiddleware, adminMiddleware, updatePageContent);
router.post('/upload', authMiddleware, adminMiddleware, uploadImage);

module.exports = router;
