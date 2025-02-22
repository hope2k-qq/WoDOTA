const express = require('express');
const router = express.Router();
const heroesController = require('../controllers/heroesController');

router.get('/heroes', heroesController.getHeroes);
router.get('/hero-attribute/:name', heroesController.getHeroAttribute);
router.get('/hero/:id', heroesController.getHeroData);

module.exports = router;