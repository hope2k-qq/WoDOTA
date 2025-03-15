const express = require('express');
const router = express.Router();
const heroesController = require('../controllers/heroesController');
const checkPassword = require('../middleware/auth');

router.get('/heroes', heroesController.getHeroes);
router.get('/hero-attribute/:name', heroesController.getHeroAttribute);
router.get('/hero/:id', heroesController.getHeroData);
router.post('/create-hero-build', heroesController.createHeroBuild);
router.get('/hero-build/:id', heroesController.getHeroBuild);
router.get('/heroesAllData', checkPassword, heroesController.getAllHeroesData);
router.get('/heroesAllDataJson', heroesController.getAllHeroesDataJson);

module.exports = router;