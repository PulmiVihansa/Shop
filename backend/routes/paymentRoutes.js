const express = require('express');
const { notifyPayment } = require('../controllers/paymentController');

const router = express.Router();

router.post('/notify', notifyPayment);

module.exports = router;
