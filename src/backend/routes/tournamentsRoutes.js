const express = require('express');
const router = express.Router();
const tournamentsController = require('../controllers/tournamentsController');

router.get('/tournament/players', tournamentsController.getTournamentList);
router.get('/tournament/qualifiers', tournamentsController.getTournamentQualifiers);
router.get('/tournament/playoffs', tournamentsController.getTournamentPlayoffs);

module.exports = router