const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');

// ==========================================
// ⚙️ CONFIGURATIONS & INITIALIZATION
// ==========================================
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 8080;

// ==========================================
// 📁 IMPORT ROUTERS & MIDDLEWARE
// ==========================================
const authRoutes = require('./Routes/authRoutes');
const gameRoutes = require('./Routes/gameRoutes');
const rentalRoutes = require('./Routes/rentalRoutes');
const userRoutes = require('./Routes/userRoutes');
const wishlistRoutes = require('./Routes/wishlistRoutes');
const errorMiddleware = require('./Middleware/errorMiddleware');
const { protect, restrictTo } = require('./Middleware/authMiddleware');

// ==========================================
// 🔌 GLOBAL MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../FrontEnd')));
app.use(express.static(path.join(__dirname, 'public')));

// EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// 🔑 TOKEN → EJS USER HELPER
// Decodes JWT from cookie or Authorization header
// and attaches user to res.locals for all EJS views
// ==========================================
app.use((req, res, next) => {
  res.locals.user = null;

  // Support token in Authorization header OR a "token" cookie
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_super_secret_key');
      res.locals.user = decoded; // { id, role, storeID }
    } catch (err) {
      // Invalid/expired token — just leave user as null
    }
  }

  next();
});

// ==========================================
// ☁️ DATABASE CONNECTION
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🎮 Connected to PS Rental Hub Database!'))
  .catch((err) => console.error('❌ DATABASE CONNECTION ERROR:', err));

// ==========================================
// 🚀 API ROUTES
// ==========================================
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the PlayStation Rental Hub API!' });
});

app.get('/api/test/admin-dashboard', protect, restrictTo('Admin'), (req, res) => {
  res.status(200).json({
    message: `Welcome, ${req.user.username}! Token is valid.`,
    user: req.user
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wishlist', wishlistRoutes);

// ==========================================
// 🖥️ EJS PAGE ROUTES
// NOTE: res.locals.user is set above from the JWT token middleware.
// EJS views use <%= user %> — no session needed.
// ==========================================
const Game = require('./models/Game');

const simpleViews = [
  'index', 'login', 'signup',
  'gamerDashboard', 'storedashboard',
  'adminDashboard', 'approveLenders', 'Checkout'
];

simpleViews.forEach((view) => {
  app.get(`/${view}`, (req, res) => res.render(view, { user: res.locals.user }));
  app.get(`/${view}.html`, (req, res) => res.render(view, { user: res.locals.user }));
});

// Browse Games — needs game list from DB
app.get('/Browse_Games', async (req, res) => {
  try {
    const games = await Game.find({ status: 'Available' }).lean();
    res.render('Browse_Games', { games, user: res.locals.user });
  } catch (err) {
    console.error('Error rendering Browse_Games:', err);
    res.render('Browse_Games', { games: [], user: res.locals.user });
  }
});
app.get('/Browse_Games.html', async (req, res) => {
  try {
    const games = await Game.find({ status: 'Available' }).lean();
    res.render('Browse_Games', { games, user: res.locals.user });
  } catch (err) {
    res.render('Browse_Games', { games: [], user: res.locals.user });
  }
});

// Game Description — needs single game from DB
app.get('/game_description', async (req, res) => {
  try {
    const gameId = req.query.id;
    let game = null;

    if (gameId) {
      if (mongoose.Types.ObjectId.isValid(gameId)) {
        game = await Game.findById(gameId).lean();
      }
      if (!game) {
        game = await Game.findOne({ gameID: gameId }).lean();
      }
    }

    res.render('game_description', { game: game || null, user: res.locals.user });
  } catch (err) {
    console.error('Error rendering game_description:', err);
    res.render('game_description', { game: null, user: res.locals.user });
  }
});
app.get('/game_description.html', async (req, res) => {
  try {
    const gameId = req.query.id;
    let game = null;

    if (gameId) {
      if (mongoose.Types.ObjectId.isValid(gameId)) {
        game = await Game.findById(gameId).lean();
      }
      if (!game) {
        game = await Game.findOne({ gameID: gameId }).lean();
      }
    }

    res.render('game_description', { game: game || null, user: res.locals.user });
  } catch (err) {
    res.render('game_description', { game: null, user: res.locals.user });
  }
});

// ==========================================
// 🚨 GLOBAL ERROR HANDLER (single, clean one)
// ==========================================
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.use(errorMiddleware);

// ==========================================
// 🛰️ START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});