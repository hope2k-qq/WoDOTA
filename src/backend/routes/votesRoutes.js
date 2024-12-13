const express = require('express');
const router = express.Router();
const votesController = require('../controllers/votesController');
const apicache = require('apicache');
const cache = apicache.middleware;

router.get('/votes', cache('30 minutes'), votesController.getVotes);

module.exports = router