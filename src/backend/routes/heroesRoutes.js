const express = require('express');
const router = express.Router();
const heroesController = require('../controllers/heroesController');
const checkPassword = require('../middleware/auth');

router.get('/heroes', heroesController.getHeroes);
router.get('/hero-attribute/:name', heroesController.getHeroAttribute);
router.get('/hero/:id', heroesController.getHeroData);
router.post('/create-hero-build', heroesController.createHeroBuild);
router.get('/hero-build/:id', heroesController.getHeroBuild);
router.get('/heroesAllData/:lang', checkPassword, (req, res) => {
    const lang = req.params.lang || 'en';
    heroesController.getAllHeroesData(req, res, lang);
});
router.get('/heroesAllDataJson/:lang', (req, res) => {
    const lang = req.params.lang || 'en';
    heroesController.getAllHeroesDataJson(req, res, lang);
});

module.exports = router;