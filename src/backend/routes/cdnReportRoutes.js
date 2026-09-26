const express = require('express');
const router = express.Router();
const checkPassword = require('../middleware/auth');
const cdnReportController = require('../controllers/cdnReportController');

const beaconBody = express.text({ type: () => true, limit: '8kb' });

router.post('/cdn-report', beaconBody, cdnReportController.createReport);
router.get('/cdn-report/stats', checkPassword, cdnReportController.getStats);

module.exports = router;
