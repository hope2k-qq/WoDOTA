const express = require('express');
const router = express.Router();
const localeController = require('../controllers/localeController');

router.get('/detect-language', localeController.detectLanguage);

module.exports = router;
