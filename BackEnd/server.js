const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./Routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');

// Load environment variables securely
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 8080;

// Global Middleware
app.use(cors());
app.use(express.json());

// Cloud Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🎮 SUCCESS: Connected securely to PS Rental Hub Cloud Database!'))
  .catch((err) => console.error('❌ DATABASE CONNECTION ERROR:', err));

// ==========================================
// 🚀 API ROUTES (For your frontend to call)
// ==========================================

// 1. Core Base Route (Just to check if the server is alive)
app.get('/', (req, res) => {
  res.json({ message: "Welcome to the PlayStation Rental Hub API!" });
});

// 2. Authentication Routes (Register/Login)
app.use('/api/auth', authRoutes);

// 3. Game Routes
app.use('/api/games', gameRoutes);

// Ignition Switch
app.listen(PORT, () => {
  console.log(`🚀 Server is flying high on http://localhost:${PORT}`);
});