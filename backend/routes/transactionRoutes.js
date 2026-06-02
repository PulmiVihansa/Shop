const express = require('express');
const { getTransactions } = require('../controllers/transactionController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, getTransactions);

module.exports = router;
