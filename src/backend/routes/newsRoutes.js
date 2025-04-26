const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
router.get('/news/:lang', (req, res) => {
    const lang = req.params.lang || 'en';
    newsController.getNews(req, res, lang);
});

module.exports = router