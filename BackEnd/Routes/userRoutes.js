const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  approveStore,
  suspendUser
} = require('../Controllers/userController');

const {
  protect,
  restrictTo
} = require('../Middleware/authMiddleware');

// =========================
// ADMIN ONLY ROUTES
// =========================

router.get(
  '/',
  protect,
  restrictTo('Admin'),
  getAllUsers
);

router.get(
  '/:id',
  protect,
  restrictTo('Admin'),
  getUser
);

router.put(
  '/:id',
  protect,
  restrictTo('Admin'),
  updateUser
);

router.delete(
  '/:id',
  protect,
  restrictTo('Admin'),
  deleteUser
);

router.patch(
  '/:id/approve',
  protect,
  restrictTo('Admin'),
  approveStore
);

router.patch(
  '/:id/suspend',
  protect,
  restrictTo('Admin'),
  suspendUser
);

module.exports = router;