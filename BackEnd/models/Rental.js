const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
    customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    game:        { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    startDate:   { type: Date, default: Date.now },
    dueDate:     { type: Date, required: true },
    pricePerDay: { type: Number, required: true },
    totalPrice:  { type: Number, required: true },
    phone:       { type: String, required: true },
    address:     { type: String, required: true },
    status:      { type: String, enum: ['active', 'returned', 'overdue'], default: 'active' }
}, { timestamps: true });

// Indexes for the rental query paths: "my rentals" / active-rental dup check
// (customer + status) and store rentals (game).
rentalSchema.index({ customer: 1, status: 1 });
rentalSchema.index({ game: 1 });

module.exports = mongoose.model('Rental', rentalSchema);