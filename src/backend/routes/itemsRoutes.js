const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');

router.get('/shop_items', itemsController.getShopItems);

module.exports = router