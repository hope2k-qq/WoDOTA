const express = require('express');
const router = express.Router();
const tournamentsControllerDuo = require('../controllers/tournamentsControllerDuo');
const tournamentsSoloController = require('../controllers/tournamentsSoloController');
const tournamentsController = require('../controllers/tournamentsController');

router.get('/tournament/players', tournamentsControllerDuo.getTournamentList);
router.get('/tournament/qualifiers', tournamentsControllerDuo.getTournamentQualifiers);
router.get('/tournament/playoffs', tournamentsControllerDuo.getTournamentPlayoffs);
router.get('/tournament/final', tournamentsControllerDuo.getTournamentFinal);
router.get('/tournament_solo/players', tournamentsSoloController.getTournamentListSolo);
router.get('/tournament_solo/qualifiers', tournamentsSoloController.getTournamentQualifiersSolo);
router.get('/tournament_solo/playoffs', tournamentsSoloController.getTournamentPlayoffsSolo);
router.get('/tournament_solo/final', tournamentsSoloController.getTournamentFinalSolo);

router.get('/tournaments', tournamentsController.getTournamentListAll);
router.get('/tournament/generate/:key', tournamentsController.getTournamentGenerate);
router.get('/tournament/latest', tournamentsController.getLatestTournament);
router.get('/tournament/:key', tournamentsController.getTournament);


module.exports = router