const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: {
    type: String,
    required: true,
    default: 'Gamer',
    enum: ['Gamer', 'Store', 'Admin']
  },
  storeID: { type: String, unique: true, sparse: true, trim: true },
  approved: { type: Boolean, default: false },
  suspended: { type: Boolean, default: false },
  balance: { type: Number, default: 0, min: 0 }
}, {
  timestamps: true,
  collection: 'Users'
});

module.exports = mongoose.model('User', userSchema);