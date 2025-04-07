const express = require('express');
const router = express.Router();
const votesController = require('../controllers/votesController');

router.get('/votes', votesController.getVotes);

module.exports = router