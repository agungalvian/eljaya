const express = require('express');
const router = express.Router();
const c = require('../controllers/reportController');

router.get('/summary', c.summary);
router.get('/profit-loss', c.profitLoss);
router.get('/balance-sheet', c.balanceSheet);
router.get('/cashflow', c.cashflow);

module.exports = router;
