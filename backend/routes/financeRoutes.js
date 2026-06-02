const express = require('express');
const { getFinanceSummary, createExpense, updateExpense, deleteExpense } = require('../controllers/financeController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);
router.get('/', getFinanceSummary);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

module.exports = router;
