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

    // Validation
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Game title is required' });
    }
    if (!platform || !['PS4', 'PS5'].includes(platform)) {
      return res.status(400).json({ error: 'Platform must be PS4 or PS5' });
    }
    if (!category || category.trim() === '') {
      return res.status(400).json({ error: 'Category is required' });
    }
    if (!pricePerDay || isNaN(pricePerDay) || pricePerDay <= 0) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }
    if (!storeID || storeID.trim() === '') {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    // Check for duplicate gameID
    if (gameID) {
      const existingGame = await Game.findOne({ gameID });
      if (existingGame) {
        return res.status(400).json({ error: 'A game with this ID already exists' });
      }
    }

    const newGame = new Game({
      gameID,
      storeID,
      title: title.trim(),
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

    // Validation
    if (req.body.title !== undefined && req.body.title.trim() === '') {
      return res.status(400).json({ error: 'Game title cannot be empty' });
    }
    if (req.body.platform !== undefined && !['PS4', 'PS5'].includes(req.body.platform)) {
      return res.status(400).json({ error: 'Platform must be PS4 or PS5' });
    }
    if (req.body.pricePerDay !== undefined && (isNaN(req.body.pricePerDay) || req.body.pricePerDay <= 0)) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }

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
    if (!req.params.ownerId || req.params.ownerId.trim() === '') {
      return res.status(400).json({ error: 'Store ID is required' });
    }
    const games = await Game.find({ storeID: req.params.ownerId });
    res.json(games);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch your games' });
  }
};

module.exports = { getAllGames, getOneGame, addGame, editGame, deleteGame, getMyGames };