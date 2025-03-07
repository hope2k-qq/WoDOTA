const express = require('express');
const router = express.Router();
const homeRoutes = require('./homeRoutes');
const proxyRoutes = require('./proxyRoutes');
const heroesRoutes = require('./heroesRoutes');
const textRoutes = require('./textRoutes');
const leaderboardRoutes = require('./leaderboardRoutes');
const patchesRoutes = require('./patchesRoutes');
const shopRoutes = require('./shopRoutes');
const votesRoutes = require('./votesRoutes');


router.use('/', homeRoutes);
router.use('/', heroesRoutes);
router.use('/', textRoutes);
router.use('/', leaderboardRoutes);
router.use('/', patchesRoutes);
router.use('/', shopRoutes);
router.use('/', votesRoutes);
router.use('/', proxyRoutes);

module.exports = router;
