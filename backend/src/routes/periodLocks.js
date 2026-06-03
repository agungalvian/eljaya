const express = require('express');
const router = express.Router();
const periodLockController = require('../controllers/periodLockController');
const { authenticate } = require('../middleware/auth');

router.get('/status', authenticate, periodLockController.getStatus);
router.post('/lock', authenticate, periodLockController.setLock);

module.exports = router;
