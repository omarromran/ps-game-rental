const Game = require('../models/Game');

// ─── GET ALL GAMES ───────────────────────────────────────────────
const getAllGames = async (req, res) => {
  try {
    // By default, only return games that are available for browsing.
    // If ?status=all is explicitly provided, return every game.
    const filter = {};
    if (req.query.status && req.query.status.toLowerCase() !== 'all') {
      filter.status = req.query.status;
    } else if (!req.query.status) {
      filter.status = 'Available';
    }

    const games = await Game.find(filter);

    res.json(games);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
};
const mongoose = require('mongoose');

// ─── GET ONE GAME ────────────────────────────────────────────────
const getOneGame = async (req, res) => {
  try {
    const id = req.params.id;
    let game = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      game = await Game.findById(id);
    }

    if (!game) {
      game = await Game.findOne({ gameID: id });
    }

    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
};
// ─── ADD GAME ────────────────────────────────────────────────────
const addGame = async (req, res) => {
  try {
    console.log("FILES:");
    console.log(req.files);

    console.log("BODY:");
    console.log(req.body);
    console.log("REQ BODY:", req.body);
    console.log("REQ FILES:", req.files);
    console.log("REQ USER:", req.user);

    const {
      gameID: incomingGameID,
      storeID: incomingStoreID,
      title,
      description,
      category,
      platform,
      pricePerDay,
      developer,
      releaseYear,
      pegi,
      type
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

    // ── NEW FIX: require at least one uploaded image ──────────
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'At least one image is required'
      });
    }

    const storeID =
      incomingStoreID ||
      req.user.storeID ||
      req.user._id.toString();

    if (!storeID || storeID.trim() === '') {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    const gameID =
      incomingGameID && incomingGameID.trim() !== ''
        ? incomingGameID.trim()
        : `${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

    const existingGame = await Game.findOne({ gameID });

    if (existingGame) {
      return res.status(400).json({
        error: 'A game with this ID already exists'
      });
    }

    // ── FIXED IMAGE EXTRACTION ────────────────────────────────
    // ── Extract Cloudinary URLs from uploaded files ────────────
    // ── Extract Cloudinary URLs from uploaded files ────────────
    const imageUrls = req.files && req.files.length > 0
      ? req.files.map((file) => {

        console.log("UPLOADED FILE OBJECT:");
        console.log(file);

        return (
          file.path ||
          file.secure_url ||
          file.url ||
          null
        );
      }).filter(Boolean)
      : [];

    // ensure at least one image exists
    if (imageUrls.length === 0) {
      return res.status(400).json({
        error: 'Image upload failed. No image URL was returned.'
      });
    }

    const imgValue = imageUrls[0];

    const newGame = new Game({
      gameID,
      storeID,
      title: title.trim(),
      description,
      category,
      platform,
      pricePerDay: Number(pricePerDay),
      img: imgValue,
      images: imageUrls,
      developer,
      releaseYear,
      pegi,
      type
    });

    const savedGame = await newGame.save();

    console.log("SAVED GAME:");
    console.log(savedGame);

    res.status(201).json(savedGame);
  } catch (err) {

    console.log('ADD GAME ERROR:', err);

    res.status(500).json({
      error: err.message || 'Failed to add game'
    });
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
      const newImageUrls = req.files.map(file => file.path || file.secure_url || file.url).filter(Boolean);
      if (newImageUrls.length > 0) {
        req.body.images = newImageUrls;
        req.body.img = newImageUrls[0];
      }
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

const getMyGames = async (req, res) => {
  try {
    // Match games where storeID may be stored as a string or ObjectId
    const ownerId = req.user && req.user._id ? req.user._id : null;
    const ownerIdStr = ownerId ? ownerId.toString() : null;

    const query = ownerId
      ? { storeID: { $in: [ownerId, ownerIdStr] } }
      : { storeID: null };

    const games = await Game.find(query).lean();

    return res.status(200).json({
      status: 'success',
      results: games.length,
      data: { games },
    });
  } catch (err) {
    console.error('GET MY GAMES ERROR:', err);
    return res.status(500).json({ error: 'Failed to fetch owner games' });
  }
};
module.exports = { getAllGames, getOneGame, addGame, editGame, deleteGame, getMyGames };