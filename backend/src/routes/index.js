const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Auth routes (unprotected)
router.use('/auth', require('./auth'));

// User management routes
router.use('/users', require('./users'));

// Financial & Operational routes (protected)
router.use('/projects', authenticate, authorize('projects'), require('./projects'));
router.use('/transactions', authenticate, authorize('bankStatement'), require('./transactions'));
router.use('/debts', authenticate, authorize('debts'), require('./debts'));
router.use('/employees', authenticate, authorize('payrollAssets'), require('./employees'));
router.use('/assets', authenticate, authorize('payrollAssets'), require('./assets'));
router.use('/receipts', authenticate, authorize('receipts'), require('./receipts'));
router.use('/reports', authenticate, authorize('reports'), require('./reports'));
router.use('/period-locks', require('./periodLocks'));

module.exports = router;

