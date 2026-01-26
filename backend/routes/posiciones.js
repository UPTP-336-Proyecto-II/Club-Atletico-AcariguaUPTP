const express = require('express');
const router = express.Router();
const posicionesController = require('../controllers/posicionesController');

router.get('/', posicionesController.getPosiciones);

module.exports = router;
