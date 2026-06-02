const express = require('express');
const authRoutes  = require('./auth');
const usersRoutes = require('./users');

const router = express.Router();

router.use('/auth',  authRoutes);
router.use('/users', usersRoutes);

// Ajoute tes routes ici :
// router.use('/products', require('./products'));

module.exports = router;
