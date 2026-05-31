const User = require('../models/User');
const Game = require('../models/Game');

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

    const game = await Game.findById(gameId);

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

    const alreadyExists = user.wishlist.some(
        id => id.toString() === gameId
    );

    if (alreadyExists) {
        return res.status(400).json({
            message: 'Game already in wishlist'
        });
    }

    user.wishlist.push(gameId);

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

    user.wishlist = user.wishlist.filter(
        id => id.toString() !== gameId
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
