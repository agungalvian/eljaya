const express = require('express');
const router = express.Router();
const c = require('../controllers/receiptController');

router.get('/', c.list);
router.post('/', c.create);
router.delete('/:id', c.remove);

module.exports = router;
