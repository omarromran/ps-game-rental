const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    games:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }]
}, { timestamps: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);