const express = require('express');
const { getBulkCustomers, createBulkCustomer } = require('../controllers/bulkOrderController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);
router.get('/customers', getBulkCustomers);
router.post('/customers', createBulkCustomer);

module.exports = router;
