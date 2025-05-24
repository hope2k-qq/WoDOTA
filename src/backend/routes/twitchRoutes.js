const express = require('express');
const router = express.Router();
const twitchController = require('../controllers/twitchController');

router.get('/twitch_follows', twitchController.getTwitchFollows);

module.exports = router