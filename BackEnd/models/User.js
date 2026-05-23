const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    default: 'Gamer', 
    enum: ['Gamer', 'StoreOwner', 'Admin'] 
  },
  balance: { type: Number, default: 0, min: 0 }
}, { 
  timestamps: true,
  collection: 'Users' // <--- ADD THIS LINE EXACTLY!
});

module.exports = mongoose.model('User', userSchema);