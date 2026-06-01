const User = require('../models/User');
const Game = require('../models/Game');
const mongoose = require('mongoose');

// GET /api/wishlist
exports.getWishlist = async (req, res) => {
try {

    const user = await User.findById(req.user._id)
        .populate('wishlist');

    if (!user) {
        return res.status(404).json({
            message: 'User not found'
        });
    }

    res.status(200).json(user.wishlist);

} catch (error) {

    console.error(error);

    res.status(500).json({
        message: 'Failed to fetch wishlist'
    });
}

};

// POST /api/wishlist/:gameId
exports.addToWishlist = async (req, res) => {
try {

    const { gameId } = req.params;

    // ✅ FIXED: find by MongoDB _id OR custom gameID
    let game = null;
    if (mongoose.Types.ObjectId.isValid(gameId)) {
        game = await Game.findById(gameId);
    }
    if (!game) {
        game = await Game.findOne({ gameID: gameId });
    }

    if (!game) {
        return res.status(404).json({
            message: 'Game not found'
        });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(404).json({
            message: 'User not found'
        });
    }

    // Use game._id for consistency in wishlist
    const mongoId = game._id.toString();

    const alreadyExists = user.wishlist.some(
        id => id.toString() === mongoId
    );

    if (alreadyExists) {
        return res.status(400).json({
            message: 'Game already in wishlist'
        });
    }

    user.wishlist.push(game._id);

    await user.save();

    res.status(200).json({
        message: 'Game added to wishlist'
    });

} catch (error) {

    console.error(error);

    res.status(500).json({
        message: 'Failed to add game to wishlist'
    });
}

};

// DELETE /api/wishlist/:gameId
exports.removeFromWishlist = async (req, res) => {
try {

    const { gameId } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(404).json({
            message: 'User not found'
        });
    }

    // ✅ FIXED: match by MongoDB _id OR custom gameID
    let mongoId = gameId;
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
        const game = await Game.findOne({ gameID: gameId });
        if (game) mongoId = game._id.toString();
    }

    user.wishlist = user.wishlist.filter(
        id => id.toString() !== mongoId
    );

    await user.save();

    res.status(200).json({
        message: 'Game removed from wishlist'
    });

} catch (error) {

    console.error(error);

    res.status(500).json({
        message: 'Failed to remove game from wishlist'
    });
}

};