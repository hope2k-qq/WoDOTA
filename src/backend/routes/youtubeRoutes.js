const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/youtubeController');

router.get('/youtube', youtubeController.getCreatorsVideos);
router.get('/youtube/image-proxy', youtubeController.getProxyImage);

module.exports = router;