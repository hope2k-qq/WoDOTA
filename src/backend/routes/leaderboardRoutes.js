const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const apicache = require('apicache');
const cache = apicache.middleware;

router.get('/leaderboard_rating', cache('10 minutes'), leaderboardController.getRating);
router.get('/leaderboard_arena', cache('10 minutes'), leaderboardController.getArena);

module.exports = router;
