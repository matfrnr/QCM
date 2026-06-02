const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, refresh, logout, me } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

const router = express.Router();

// Rate limiter strict pour les routes d'auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Trop de tentatives. Réessaie dans 15 minutes.' },
});

router.post('/register', authLimiter, validate(schemas.auth.register), register);
router.post('/login',    authLimiter, validate(schemas.auth.login),    login);
router.post('/refresh',               validate(schemas.auth.refresh),   refresh);
router.post('/logout',                                                   logout);
router.get('/me',        authenticate,                                   me);

module.exports = router;
