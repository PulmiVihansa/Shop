const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingController');
const { getPaymentSettings, updatePaymentSettings } = require('../controllers/paymentSettingsController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getSettings);
router.get('/payment', getPaymentSettings);
router.put('/', authMiddleware, adminMiddleware, updateSettings);
router.put('/payment', authMiddleware, adminMiddleware, updatePaymentSettings);

module.exports = router;
