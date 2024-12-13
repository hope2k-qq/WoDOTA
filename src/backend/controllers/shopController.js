const { extractItems } = require('../services/shopService');

exports.getShopItems = (req, res) => {
    try {
        const itemsData = extractItems();
        res.json(itemsData);
    } catch (error) {
        console.error('Error while retrieving data:', error);
        res.status(500).send('Error while retrieving data.');
    }
};
