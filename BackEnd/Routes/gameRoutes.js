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



router.get('/', getAllGames);

router.get(
  '/my/games',
  protect,
  restrictTo('Store'),
  getMyGames
);

router.get('/:id', getOneGame);

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


router.put(
  '/:id',
  protect,
  restrictTo('Store', 'Admin'),
  upload.array('images', 5),
  editGame
);

router.delete(
  '/:id',
  protect,
  restrictTo('Store', 'Admin'),
  deleteGame
);

router.get('/:id', getOneGame);
module.exports = router;
