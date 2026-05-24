const Game = require('../models/Game');

// ─── GET ALL GAMES ───────────────────────────────────────────────
const getAllGames = async (req, res) => {
  try {
    const games = await Game.find({ status: 'Available' });

    // changed from res.json(games)
    res.render('browse_games', { games });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
};

// ─── GET ONE GAME ────────────────────────────────────────────────
const getOneGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.render('game_detail', { game });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
};

// ─── ADD GAME ────────────────────────────────────────────────────
const addGame = async (req, res) => {
  try {
    const {
      gameID, storeID, title, description,
      category, platform, pricePerDay,
      developer, releaseYear, pegi, type
    } = req.body;

    // ── Validation (unchanged) ────────────────────────────────
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

    if (gameID) {
      const existingGame = await Game.findOne({ gameID });
      if (existingGame) {
        return res.status(400).json({ error: 'A game with this ID already exists' });
      }
    }

    // ── CHANGE 1: Extract Cloudinary URLs from uploaded files ──
    // upload.array() in the route fills req.files before this runs
    // each file object has a .path property = the Cloudinary URL
    const imageUrls = req.files && req.files.length > 0
      ? req.files.map((file) => file.path)
      : [];

    // ── CHANGE 2: img field falls back to first uploaded image ──
    // if the request body has an img URL use it (old behaviour)
    // if not but files were uploaded, use the first Cloudinary URL
    // if neither, it stays undefined (schema marks img as required
    // so the save will fail with a clear validation error)
    const imgValue = req.body.img || imageUrls[0];

    const newGame = new Game({
      gameID,
      storeID,
      title: title.trim(),
      description,
      category,
      platform,
      pricePerDay,
      img: imgValue,       // single cover — unchanged field
      images: imageUrls,   // ← NEW: full array of Cloudinary URLs
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

// ─── EDIT GAME ───────────────────────────────────────────────────
const editGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    // ── Validation (unchanged) ────────────────────────────────
    if (req.body.title !== undefined && req.body.title.trim() === '') {
      return res.status(400).json({ error: 'Game title cannot be empty' });
    }
    if (req.body.platform !== undefined && !['PS4', 'PS5'].includes(req.body.platform)) {
      return res.status(400).json({ error: 'Platform must be PS4 or PS5' });
    }
    if (req.body.pricePerDay !== undefined && (isNaN(req.body.pricePerDay) || req.body.pricePerDay <= 0)) {
      return res.status(400).json({ error: 'Price must be a positive number' });
    }

    // ── CHANGE 3: Handle new image uploads on edit ────────────
    // if the owner uploads new images during an edit, replace the array
    // if no new files are sent, keep the existing images untouched
    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map((file) => file.path);

      // also update the single img field to the new first image
      req.body.img = req.body.images[0];
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

// ─── DELETE GAME ─────────────────────────────────────────────────
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

// ─── GET MY GAMES ────────────────────────────────────────────────
const getMyGames = async (req, res, next) => {
  try {
    // ── CHANGE 4: Fixed field name to match your schema ───────
    // your schema has storeID: String, not owner: ObjectId
    // req.user._id comes from verifyToken middleware as a string
    const games = await Game.find({ storeID: req.user._id });

    res.status(200).json({
      status: 'success',
      results: games.length,
      data: { games },
    });
  } catch (err) {
    next(err);
  }
};

// ── CHANGE 5: Fixed inconsistent export style ─────────────────────
// original file mixed two styles:
// getMyGames used  →  exports.getMyGames = ...
// all others used  →  module.exports = { ... }
// mixing these breaks the module — only one style should be used
// everything is now declared as const and exported together at the bottom

module.exports = { getAllGames, getOneGame, addGame, editGame, deleteGame, getMyGames };