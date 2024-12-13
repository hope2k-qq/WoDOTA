const express = require('express');
const router = express.Router();
const patchesController = require('../controllers/patchesController');

router.get('/patches', patchesController.getPatches);

module.exports = router