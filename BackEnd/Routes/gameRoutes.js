const express = require('express');
const router = express.Router();

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

    const games = await Game.find();

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