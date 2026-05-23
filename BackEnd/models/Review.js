const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    game:     { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    rating:   { type: Number, min: 1, max: 5, required: true },
    comment:  { type: String, trim: true }
}, { timestamps: true });

reviewSchema.index({ customer: 1, game: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);