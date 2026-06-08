const express = require('express');
const router = express.Router();

const {
getWishlist,
addToWishlist,
removeFromWishlist
} = require('../Controllers/wishlistController');

const {protect} = require('../Middleware/authMiddleware');

router.get('/',protect,getWishlist);

router.post('/:gameId',protect,addToWishlist);

router.delete('/:gameId',protect,removeFromWishlist);

module.exports = router;
