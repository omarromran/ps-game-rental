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
  (req, res, next) => {
    if (req.user.role === 'Admin' || req.user._id.toString() === req.params.id) {
      return next();
    }
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  },
  getUser
);


// USER CAN UPDATE THEIR OWN PROFILE, ADMIN CAN UPDATE ANYONE
router.put(
  '/:id',
  protect,
  (req, res, next) => {
    const currentUser = req.user;
    const targetId = req.params.id;

    // Allow if admin OR if user is updating their own profile
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

router.patch(
  '/:id/suspend',
  protect,
  restrictTo('Admin'),
  suspendUser
);

module.exports = router;