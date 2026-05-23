const express = require('express');
const router = express.Router();
const { checkout, getMyRentals, returnGame, getAllRentals } = require('../Controllers/rentalController');

router.post('/checkout', checkout);
router.get('/my', getMyRentals);
router.patch('/:id/return', returnGame);
router.get('/', getAllRentals);

module.exports = router;