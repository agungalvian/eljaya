const express = require('express');
const router = express.Router();
const c = require('../controllers/assetController');

router.get('/', c.list);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
