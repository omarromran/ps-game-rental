const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🎮 SUCCESS: Connected securely to PS Rental Hub Cloud Database!'))
  .catch((err) => console.error('❌ DATABASE CONNECTION ERROR:', err));

// Core Route
app.get('/', (req, res) => {
  res.json({ message: "Welcome to the PlayStation Rental Hub API!" });
});

// CRUCIAL: This keeps the server running!
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});