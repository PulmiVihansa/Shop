const express = require('express');
const { getAnalytics } = require('../controllers/analyticsController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, getAnalytics);

module.exports = router;
