const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// All user routes require authentication and 'users' menu write access for editing,
// and at least read/write for viewing. We will put the middleware here:
router.use(authenticate);

router.get('/', authorize('users'), userController.list);
router.post('/', authorize('users'), userController.create);
router.put('/:id', authorize('users'), userController.update);
router.delete('/:id', authorize('users'), userController.remove);

module.exports = router;
