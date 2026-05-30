const express = require('express');
const passport = require('passport');
const {
  registerUser,
  loginUser,
  getMe,
  redirectGoogleAuthSuccess,
  redirectWithOAuthError
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const devLog = require('../utils/devLog');

// Auth routes for register and login.
const router = express.Router();
const googleFailureRedirect = `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/auth/success?error=oauth_failed`;

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/google', (req, res, next) => {
  devLog('[auth][google] initiate route hit', {
    hasClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
    hasClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET)
  });

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    devLog('[auth][google] initiate route blocked because credentials are missing');
    return redirectWithOAuthError(res, 'oauth_not_configured');
  }

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account'
  })(req, res, next);
});
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: googleFailureRedirect
  }),
  redirectGoogleAuthSuccess
);
router.get('/me', authMiddleware, getMe);

module.exports = router;
