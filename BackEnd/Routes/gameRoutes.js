const express = require('express');
const router = express.Router();
const {
  getAllGames,
  getOneGame,
  addGame,
  editGame,
  deleteGame,
  getMyGames
} = require('../controllers/gameController');

router.get('/', getAllGames);
router.get('/my/:ownerId', getMyGames);
router.get('/:id', getOneGame);
router.post('/add', addGame);
router.put('/:id', editGame);
router.delete('/:id', deleteGame);

module.exports = router;