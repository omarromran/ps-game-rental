const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameID: { type: String, required: true },
  storeID: { type: String, required: true },
  customerID: { type: String, default: null },
  status: { type: String, required: true, default: 'Available', enum: ['Available', 'Rented', 'Maintenance'] },
  title: { type: String, required: true, trim: true },
  type: { type: String, required: true, default: 'Game' },
  platform: { type: String, required: true, enum: ['PS4', 'PS5', 'PS4 & PS5'] },
  pricePerDay: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  img: { type: String, required: true },
  images: { type: [String], default: [] },   // ← Cloudinary uploaded images
 description: { type: String },
  // These are sent by the add-game form but were previously not declared,
  // so Mongoose silently dropped them. Declaring them persists the values.
  developer:   { type: String, trim: true, default: '' },
  releaseYear: { type: Number, min: 1970, max: 2100 },
  pegi:        { type: String, trim: true, default: '' },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }]
}, { timestamps: true, collection: 'Games' });

// Indexes for the most frequent query paths (non-unique, safe to add over
// existing data): browse catalog (status + title sort), store dashboards
// (storeID), and custom-id lookups (gameID).
gameSchema.index({ status: 1, title: 1 });
gameSchema.index({ storeID: 1 });
gameSchema.index({ gameID: 1 });

module.exports = mongoose.model('Game', gameSchema);