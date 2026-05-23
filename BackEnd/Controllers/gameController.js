const Game = require('../models/Game');

// Get all games (Browse page)
const getAllGames = async (req, res) => {
  try {
    const games = await Game.find({ status: 'Available' });
    res.json(games);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
};

// Get one game (Game description page)
const getOneGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
};

// Add a game (Store owner)
const addGame = async (req, res) => {
  try {
    const { gameID, storeID, title, description, category, platform, pricePerDay, img, developer, releaseYear, pegi, type } = req.body;
    const newGame = new Game({
      gameID,
      storeID,
      title,
      description,
      category,
      platform,
      pricePerDay,
      img,
      developer,
      releaseYear,
      pegi,
      type
    });
    await newGame.save();
    res.status(201).json(newGame);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to add game' });
  }
};

// Edit a game (Store owner)
const editGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    const updatedGame = await Game.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedGame);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to update game' });
  }
};

// Delete a game (Store owner / Admin)
const deleteGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    await Game.findByIdAndDelete(req.params.id);
    res.json({ message: 'Game deleted successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to delete game' });
  }
};

// Get my games (Store owner dashboard)
const getMyGames = async (req, res) => {
  try {
    const games = await Game.find({ storeID: req.params.ownerId });
    res.json(games);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch your games' });
  }
};

module.exports = { getAllGames, getOneGame, addGame, editGame, deleteGame, getMyGames };