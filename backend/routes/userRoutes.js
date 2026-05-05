const express = require('express');
const { getUsers, deleteUser } = require('../controllers/userController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);
router.get('/', getUsers);
router.delete('/:id', deleteUser);

module.exports = router;
