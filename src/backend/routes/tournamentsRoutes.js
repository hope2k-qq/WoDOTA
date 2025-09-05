const express = require('express');
const router = express.Router();
const tournamentsController = require('../controllers/tournamentsController');
const tournamentsSoloController = require('../controllers/tournamentsSoloController');

router.get('/tournament/players', tournamentsController.getTournamentList);
router.get('/tournament/qualifiers', tournamentsController.getTournamentQualifiers);
router.get('/tournament/playoffs', tournamentsController.getTournamentPlayoffs);
router.get('/tournament/final', tournamentsController.getTournamentFinal);

router.get('/tournament_solo/players', tournamentsSoloController.getTournamentListSolo);
router.get('/tournament_solo/qualifiers', tournamentsSoloController.getTournamentQualifiersSolo);
router.get('/tournament_solo/playoffs', tournamentsSoloController.getTournamentPlayoffsSolo);
router.get('/tournament_solo/final', tournamentsSoloController.getTournamentFinalSolo);

module.exports = router