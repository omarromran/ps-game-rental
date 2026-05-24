const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session'); // Kept safe for your team!

// ==========================================
// ⚙️ CONFIGURATIONS & INITIALIZATION
// ==========================================

// Load environment variables securely
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 8080;

// ==========================================
// 📁 IMPORT ROUTERS & MIDDLEWARE
// ==========================================
const authRoutes = require('./Routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const rentalRoutes = require('./Routes/rentalRoutes');
const userRoutes = require('./Routes/userRoutes');

// Import your custom security gatekeepers
const { protect, restrictTo } = require('./Middleware/authMiddleware'); 

// ==========================================
// 🔌 GLOBAL MIDDLEWARE & SESSIONS
// ==========================================
app.use(cors());
app.use(express.json()); 
app.use(express.static(path.join(__dirname, '../FrontEnd')));

// EJS view engine setup for converted front-end pages
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Express Session Configuration (Maintained for your teammates)
app.use(session({
    secret: process.env.SESSION_SECRET || 'pshub-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// ==========================================
// ☁️ CLOUD DATABASE CONNECTION
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🎮 SUCCESS: Connected securely to PS Rental Hub Cloud Database!'))
  .catch((err) => console.error('❌ DATABASE CONNECTION ERROR:', err));

// ==========================================
// 🚀 API ROUTES 
// ==========================================

// 1. Core Base Route (Server health check)
app.get('/', (req, res) => {
  res.json({ message: "Welcome to the PlayStation Rental Hub API!" });
});

// 2. Security Guard Verification Test Route
// (Moved here safely *below* app initialization so it doesn't crash!)
app.get('/api/test/admin-dashboard', protect, restrictTo('Admin'), (req, res) => {
  res.status(200).json({
    message: `Welcome to the Secret Admin Dashboard, ${req.user.username}! Your token is perfectly valid.`,
    user: req.user
  });
});

// 3. Main Business Domain Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/users', userRoutes);

// Render converted EJS front-end pages from their original HTML endpoints
const pageViews = [
  'index',
  'login',
  'signup',
  'Browse_Games',
  'game_description',
  'Checkout',
  'gamerDashboard',
  'storedashboard',
  'adminDashboard',
  'approveLenders'
];
pageViews.forEach((view) => {
  if (view === 'Browse_Games') {
    const Game = require('./models/Game');
    app.get(`/${view}`, async (req, res) => {
      try {
        const games = await Game.find({ status: 'Available' }).lean();
        return res.render(view, { games, user: req.session.user || null });
      } catch (err) {
        console.error('Error rendering Browse_Games:', err);
        return res.render(view, { games: [], user: req.session.user || null });
      }
    });
    app.get(`/${view}.html`, async (req, res) => {
      try {
        const games = await Game.find({ status: 'Available' }).lean();
        return res.render(view, { games, user: req.session.user || null });
      } catch (err) {
        console.error('Error rendering Browse_Games:', err);
        return res.render(view, { games: [], user: req.session.user || null });
      }
    });
    return;
  }

  app.get(`/${view}`, (req, res) => res.render(view));
  app.get(`/${view}.html`, (req, res) => res.render(view));
});

// ==========================================
// 🛰️ IGNITION SWITCH
app.listen(PORT, () => {
  console.log(`🚀 Server is flying high on http://localhost:${PORT}`);
});