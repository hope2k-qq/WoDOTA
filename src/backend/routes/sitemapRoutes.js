const express = require('express');
const router = express.Router();
const sitemapController = require('../controllers/sitemapController');

router.get('/sitemap.xml', sitemapController.getSitemapIndex);

router.get('/sitemap_:lang.xml', async (req, res) => {
    const lang = req.params.lang || 'en';

    try {
        await sitemapController.getSitemapLang(req, res, lang);
    } catch (error) {
        console.error('Ошибка при генерации sitemap:', error);
        res.status(500).send('Ошибка сервера');
    }
});

module.exports = router