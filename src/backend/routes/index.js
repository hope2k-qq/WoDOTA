const express = require('express');
const router = express.Router();
const homeRoutes = require('./homeRoutes');
const heroesRoutes = require('./heroesRoutes');
const textRoutes = require('./textRoutes');
const leaderboardRoutes = require('./leaderboardRoutes');
const patchesRoutes = require('./patchesRoutes');
const shopRoutes = require('./shopRoutes');
const votesRoutes = require('./votesRoutes');
const newsRoutes = require('./newsRoutes');
const tournamentsRoutes = require('./tournamentsRoutes');
const sitemapRoutes = require('./sitemapRoutes');
const subscribersRoutes = require('./subscribersRoutes');

router.use('/', homeRoutes);
router.use('/', heroesRoutes);
router.use('/', textRoutes);
router.use('/', leaderboardRoutes);
router.use('/', patchesRoutes);
router.use('/', shopRoutes);
router.use('/', votesRoutes);
router.use('/', newsRoutes);
router.use('/', tournamentsRoutes);
router.use('/', sitemapRoutes);
router.use('/', subscribersRoutes);

module.exports = router;
