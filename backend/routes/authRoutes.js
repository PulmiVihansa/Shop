const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');

// Auth routes for register and login.
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;
