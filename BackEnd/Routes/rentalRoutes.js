const express = require('express');
const router = express.Router();
const { checkout, getMyRentals, returnGame, getAllRentals, getStoreRentals } = require('../Controllers/rentalController');
const { protect, restrictTo } = require('../Middleware/authMiddleware');

router.post('/checkout', protect, checkout);
router.get('/my', protect, getMyRentals);
router.get('/store', protect, restrictTo('Store'), getStoreRentals);
router.patch('/:id/return', protect, returnGame);
router.get('/', protect, restrictTo('Admin'), getAllRentals);

module.exports = router;