const express = require('express');
const router = express.Router();
const multer = require('multer');
const c = require('../controllers/transactionController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', c.list);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/', c.clearAll);
router.delete('/:id', c.remove);
router.post('/import-csv', upload.single('file'), c.importCSV);

module.exports = router;
