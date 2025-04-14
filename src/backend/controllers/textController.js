const textService = require('../services/textService');

// exports.getAllData = (req, res) => {
//     const jsonData = textService.getAllData();
//     if (jsonData) {
//         res.json(jsonData);
//     } else {
//         res.status(500).json({ error: 'Data not available' });
//     }
// };

exports.getGeneralTalentsData = (req, res, lang) => {
    const jsonData = textService.getGeneralTalentsData(lang);
    if (jsonData) {
        res.json(jsonData);
    } else {
        res.status(500).json({ error: 'Data not available' });
    }
};