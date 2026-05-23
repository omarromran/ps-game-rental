const express = require('express');
const router = express.Router();
const { getAllUsers, getUser, updateUser, deleteUser, approveStore, suspendUser } = require('../Controllers/userController');

router.get('/', getAllUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/approve', approveStore);
router.patch('/:id/suspend', suspendUser);

module.exports = router;