const express = require('express');
const router = express.Router();
const subscribersController = require('../controllers/subscribersController');

router.get('/subscribers', subscribersController.getSubscribers);

module.exports = router