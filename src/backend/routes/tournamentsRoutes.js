const express = require('express');
const router = express.Router();
const tournamentsController = require('../controllers/tournamentsController');
const apicache = require('apicache');
const cache = apicache.middleware;

router.get('/tournament/players', cache('60 minutes'), tournamentsController.getTournamentList);
router.get('/tournament/qualifiers', cache('60 minutes'), tournamentsController.getTournamentQualifiers);
router.get('/tournament/playoffs', cache('60 minutes'), tournamentsController.getTournamentPlayoffs);

module.exports = router