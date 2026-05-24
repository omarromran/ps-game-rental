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

const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// ─── PUBLIC ROUTES ───────────────────────────────────────────────
// No login required — anyone can browse games

router.get('/', getAllGames);
router.get('/:id', getOneGame);

// ─── BUSINESS ROUTES ─────────────────────────────────────────────
// Must be logged in as a business owner

// Get my own games — owner ID comes from the token, NOT the URL
router.get('/my/games', verifyToken, restrictTo('business'), getMyGames);

// Add a game with image upload
router.post(
  '/',
  verifyToken,
  restrictTo('business'),
  upload.array('images', 5),
  addGame
);

// Edit a game
router.put('/:id', verifyToken, restrictTo('business'), editGame);

// Delete a game
router.delete('/:id', verifyToken, restrictTo('business'), deleteGame);

module.exports = router;
console.log({ getAllGames, getOneGame, addGame, editGame, deleteGame, getMyGames, verifyToken, restrictTo });