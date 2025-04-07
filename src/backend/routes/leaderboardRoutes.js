const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');

router.get('/leaderboard_rating', leaderboardController.getRating);
router.get('/leaderboard_arena', leaderboardController.getArena);

module.exports = router;
