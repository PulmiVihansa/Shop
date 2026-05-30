const express = require('express');
const {
  getCmsContent,
  updateCmsContent,
} = require('../controllers/contentController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getCmsContent);
router.put('/', authMiddleware, adminMiddleware, updateCmsContent);

module.exports = router;
