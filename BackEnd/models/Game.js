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
  developer: { type: String },
  releaseYear: { type: Number },
  pegi: { type: Number },
 description: { type: String },
}, { timestamps: true, collection: 'Games' });

module.exports = mongoose.model('Game', gameSchema);