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

// ─── PUBLIC ROUTES ──────────────────────────────────────────────


router.get('/', getAllGames);

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

router.get('/:id', getOneGame);
module.exports = router;
