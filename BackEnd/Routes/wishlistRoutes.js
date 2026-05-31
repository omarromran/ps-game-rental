const express = require('express');
const router = express.Router();

const {
getWishlist,
addToWishlist,
removeFromWishlist
} = require('../Controllers/wishlistController');

const {protect} = require('../Middleware/authMiddleware');

// Get logged-in user's wishlist
router.get('/',protect,getWishlist);

// Add game to wishlist
router.post('/:gameId',protect,addToWishlist);

// Remove game from wishlist
router.delete('/:gameId',protect,removeFromWishlist);

module.exports = router;
