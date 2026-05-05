const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Auth routes for register and login.
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authMiddleware, getMe);

module.exports = router;
