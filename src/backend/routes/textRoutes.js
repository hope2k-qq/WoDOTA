const express = require('express');
const router = express.Router();
const textController = require('../controllers/textController');

router.get('/text_data', textController.getAllData);
router.get('/general_talents', textController.getGeneralTalentsData);

module.exports = router