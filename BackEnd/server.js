const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./Routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const session = require('express-session');
const rentalRoutes = require('./Routes/rentalRoutes');
const userRoutes = require('./Routes/userRoutes');

// Load environment variables securely
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 8080;

// Global Middleware
app.use(cors());

app.use(express.static(path.join(__dirname, '../FrontEnd')));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'pshub-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));


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

app.use('/api/rentals', rentalRoutes);
app.use('/api/users', userRoutes);

// Ignition Switch
app.listen(PORT, () => {
  console.log(`🚀 Server is flying high on http://localhost:${PORT}`);
});