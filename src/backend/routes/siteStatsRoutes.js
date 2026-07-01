const express = require('express');
const router = express.Router();
const siteStatsController = require('../controllers/siteStatsController');

router.get('/site_stats', siteStatsController.getSiteStats);

module.exports = router
