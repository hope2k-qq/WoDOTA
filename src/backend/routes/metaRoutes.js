const express = require('express');
const router = express.Router();
const metaController = require('../controllers/metaController');

router.get('/meta', metaController.getMetaStats);

module.exports = router