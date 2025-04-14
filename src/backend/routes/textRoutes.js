const express = require('express');
const router = express.Router();
const textController = require('../controllers/textController');

// router.get('/text_data', textController.getAllData);
router.get('/general_talents/:lang', (req, res) => {
    const lang = req.params.lang || 'en';
    textController.getGeneralTalentsData(req, res, lang);
});

module.exports = router