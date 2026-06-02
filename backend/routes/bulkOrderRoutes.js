const express = require('express');
const { getBulkOrders, createBulkOrderRequest, getBulkCustomers, updateBulkOrder, deleteBulkOrder } = require('../controllers/bulkOrderController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/requests', createBulkOrderRequest);

router.use(authMiddleware, adminMiddleware);
router.get('/', getBulkOrders);
router.put('/:id/status', updateBulkOrder);
router.delete('/:id', deleteBulkOrder);
router.get('/customers', getBulkCustomers);

module.exports = router;
