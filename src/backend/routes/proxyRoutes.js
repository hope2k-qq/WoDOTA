const express = require('express');
const router = express.Router();
const proxyController = require('../controllers/proxyController');

router.get('/proxy/video', proxyController.getProxy);

module.exports = router