const express = require('express');
const { getAll, getOne } = require('../controllers/usersController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// Toutes les routes users nécessitent d'être authentifié
router.use(authenticate);

router.get('/',    authorize('admin'), getAll);
router.get('/:id',                     getOne);

module.exports = router;
