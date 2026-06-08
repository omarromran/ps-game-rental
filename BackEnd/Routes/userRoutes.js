const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  approveStore,
  createAdmin
} = require('../Controllers/userController');

const {
  protect,
  restrictTo
} = require('../Middleware/authMiddleware');

router.get(
  '/',
  protect,
  restrictTo('Admin'),
  getAllUsers
);

router.post(
  '/admin',
  protect,
  restrictTo('Admin'),
  createAdmin
);

router.get(
  '/:id',
  protect,
  (req, res, next) => {
    if (req.user.role === 'Admin' || req.user._id.toString() === req.params.id) {
      return next();
    }
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  },
  getUser
);

router.put(
  '/:id',
  protect,
  (req, res, next) => {
    const currentUser = req.user;
    const targetId = req.params.id;

    if (currentUser.role === 'Admin' || currentUser._id.toString() === targetId) {
      return next();
    }

    return res.status(403).json({ error: 'You do not have permission to perform this action.' });
  },
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

module.exports = router;