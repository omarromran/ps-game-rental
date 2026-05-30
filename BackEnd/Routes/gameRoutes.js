const express = require('express');
const router = express.Router();
const axios = require('axios');

const {
  getAllGames,
  getOneGame,
  addGame,
  editGame,
  deleteGame,
  getMyGames,
} = require('../Controllers/gameController');

const { protect, restrictTo } = require('../Middleware/authMiddleware');
const upload = require('../Middleware/upload');

const Game = require('../models/Game');

// ─────────────────────────────────────────────────────────────
// EJS VIEW ROUTE
// Render Browse Games Page
// ─────────────────────────────────────────────────────────────

router.get('/browseGames', async (req, res) => {
  try {

    const games = await Game.find({ status: 'Available' });

    res.render('browseGames', {
      games,
      user: req.user || null
    });

  } catch (error) {

    console.log(error);

    res.status(500).send('Server Error');
  }
});

// ─── PUBLIC ROUTES ───────────────────────────────────────────────
// No login required — anyone can browse games

// 🔍 GET /api/games/search-external?title=Uncharted
// Desc: Search RAWG API for a game's metadata
router.get('/search-external', async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ message: "Game title parameter is required." });
    }

    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "RAWG API key not configured." });
    }

    // 1. Hit the RAWG API endpoints searching for the game title
    const response = await axios.get(`https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(title)}&page_size=1`);
    
    if (!response.data.results || response.data.results.length === 0) {
      return res.status(404).json({ message: "No game matching that title found on RAWG." });
    }

    const gameData = response.data.results[0];

    // 2. Build a rich description with game details
    const releaseYear = gameData.released ? new Date(gameData.released).getFullYear() : 'TBA';
    const genresList = gameData.genres && gameData.genres.length > 0 
      ? gameData.genres.map(g => g.name).join(', ')
      : 'Unknown';
    const platformsList = gameData.platforms && gameData.platforms.length > 0
      ? gameData.platforms.map(p => p.platform.name).join(', ')
      : 'Multi-Platform';

    // 2. Format a clean payload back to our store frontend
    res.status(200).json({
      title: gameData.name,
      coverImage: gameData.background_image,
      genre: gameData.genres && gameData.genres.length > 0 ? gameData.genres[0].name : 'Unknown',
      description: `📅 ${releaseYear} • ⭐ ${gameData.rating || 'N/A'}/5 Rating\n🎮 Genres: ${genresList}\n💻 Platforms: ${platformsList}`
    });

  } catch (err) {
    console.error("RAWG API Error:", err.message);
    res.status(500).json({ message: "Failed to fetch metadata from RAWG API." });
  }
});

router.get('/', getAllGames);

// ─── BUSINESS ROUTES ─────────────────────────────────────────────
// Must be logged in as a business owner

// Get my own games — owner ID comes from the token, NOT the URL
// IMPORTANT: This MUST be before /:id or Express will match "my" as an id
router.get(
  '/my/games',
  protect,
  restrictTo('Store'),
  getMyGames
);

router.get('/:id', getOneGame);

// Add a game with image upload
router.post(
  '/',
  protect,
  restrictTo('Store', 'Admin'),
  upload.array('images', 5),
  (req, res, next) => {
    console.log('UPLOAD FILES:', req.files);
    next();
  },
  addGame
);

// Edit a game
router.put(
  '/:id',
  protect,
  restrictTo('Store', 'Admin'),
  upload.array('images', 5),
  editGame
);

// Delete a game
router.delete(
  '/:id',
  protect,
  restrictTo('Store', 'Admin'),
  deleteGame
);

module.exports = router;

// DEBUG LOG
console.log({
  getAllGames,
  getOneGame,
  addGame,
  editGame,
  deleteGame,
  getMyGames,
  protect,
  restrictTo
});