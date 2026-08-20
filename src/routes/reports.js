const express = require('express');
const { completedReport, pendingReport, summaryReport } = require('../controllers/reportController');

const router = express.Router();

router.get('/completed', completedReport);
router.get('/pending', pendingReport);
router.get('/summary', summaryReport);

module.exports = router;
