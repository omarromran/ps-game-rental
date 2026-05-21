const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameID: { type: String, required: true }, // Removed 'unique' so different stores can use their own IDs
  storeID: { type: String, required: true },
  customerID: { type: String, default: null },
  status: { type: String, required: true, default: 'Available', enum: ['Available', 'Rented', 'Maintenance'] },
  title: { type: String, required: true, trim: true },
  type: { type: String, required: true, default: 'Game' },
  platform: { type: String, required: true, enum: ['PS4', 'PS5'] },
  pricePerDay: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  img: { type: String, required: true },
  developer: { type: String },
  releaseYear: { type: Number },
  pegi: { type: Number },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);