const textService = require('../services/textService');

exports.getAllData = (req, res) => {
    const jsonData = textService.getAllData();
    if (jsonData) {
        res.json(jsonData);
    } else {
        res.status(500).json({ error: 'Data not available' });
    }
};

exports.getGeneralTalentsData = (req, res) => {
    const jsonData = textService.getGeneralTalentsData();
    if (jsonData) {
        res.json(jsonData);
    } else {
        res.status(500).json({ error: 'Data not available' });
    }
};