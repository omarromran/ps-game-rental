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

    const games = await Game.find(filter).sort({ title: 1 });

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
    return res.json(game);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
};
// ─── ADD GAME ────────────────────────────────────────────────────
const addGame = async (req, res) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (req.user.role !== 'Store' && req.user.role !== 'Admin') {
      return res.status(403).json({
        error: 'Only stores can add games'
      });
    }

    const {
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

    if (!title?.trim()) {
      return res.status(400).json({
        error: 'Game title is required'
      });
    }

    if (title.length > 100) {
      return res.status(400).json({
        error: 'Title is too long'
      });
    }

    if (description && description.length > 2000) {
      return res.status(400).json({
        error: 'Description is too long'
      });
    }

    const validPlatforms = [
      'PS4',
      'PS5',
      'PS4 & PS5'
    ];

    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        error: 'Invalid platform'
      });
    }

    if (!category?.trim()) {
      return res.status(400).json({
        error: 'Category is required'
      });
    }

    if (
      !pricePerDay ||
      isNaN(pricePerDay) ||
      Number(pricePerDay) <= 0
    ) {
      return res.status(400).json({
        error: 'Price must be greater than zero'
      });
    }

    if (
      releaseYear &&
      (
        isNaN(releaseYear) ||
        releaseYear < 1970 ||
        releaseYear > new Date().getFullYear() + 1
      )
    ) {
      return res.status(400).json({
        error: 'Invalid release year'
      });
    }

    if (
      pegi &&
      (
        isNaN(pegi) ||
        pegi < 3 ||
        pegi > 18
      )
    ) {
      return res.status(400).json({
        error: 'Invalid PEGI rating'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'At least one image is required'
      });
    }

    const imageUrls = req.files
      .map(file => file.path || file.url || file.secure_url)
      .filter(Boolean);

    if (imageUrls.length === 0) {
      return res.status(400).json({
        error: 'Image upload failed'
      });
    }

    const gameID =
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const game = await Game.create({
      gameID,
      storeID: req.user.storeID,
      title: title.trim(),
      description: description?.trim(),
      category: category.trim(),
      platform,
      pricePerDay: Number(pricePerDay),
      img: imageUrls[0],
      images: imageUrls,
      developer,
      releaseYear,
      pegi,
      type: type || 'Game'
    });

    res.status(201).json(game);

  } catch (err) {

    console.error('ADD GAME ERROR:', err);

    res.status(500).json({
      error: 'Failed to add game'
    });

  }
};
// ─── EDIT GAME ───────────────────────────────────────────────────
const editGame = async (req, res) => {
  try {

    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({
        error: 'Game not found'
      });
    }

    if (
      req.user.role === 'Store' &&
      game.storeID !== req.user.storeID
    ) {
      return res.status(403).json({
        error: 'You are not allowed to edit this game'
      });
    }

    const updateData = {};

    if (req.body.title !== undefined) {

      if (!req.body.title.trim()) {
        return res.status(400).json({
          error: 'Title cannot be empty'
        });
      }

      updateData.title = req.body.title.trim();
    }

    if (req.body.description !== undefined) {
      updateData.description = req.body.description.trim();
    }

    if (req.body.category !== undefined) {
      updateData.category = req.body.category.trim();
    }

    if (req.body.platform !== undefined) {

      const validPlatforms = [
        'PS4',
        'PS5',
        'PS4 & PS5'
      ];

      if (!validPlatforms.includes(req.body.platform)) {
        return res.status(400).json({
          error: 'Invalid platform'
        });
      }

      updateData.platform = req.body.platform;
    }

    if (req.body.pricePerDay !== undefined) {

      if (
        isNaN(req.body.pricePerDay) ||
        Number(req.body.pricePerDay) <= 0
      ) {
        return res.status(400).json({
          error: 'Invalid price'
        });
      }

      updateData.pricePerDay =
        Number(req.body.pricePerDay);
    }

    if (req.body.status !== undefined) {

      const validStatuses = [
        'Available',
        'Rented',
        'Maintenance'
      ];

      if (!validStatuses.includes(req.body.status)) {
        return res.status(400).json({
          error: 'Invalid status'
        });
      }

      updateData.status = req.body.status;
    }

    if (req.files && req.files.length > 0) {

      const imageUrls = req.files
        .map(file => file.path || file.url || file.secure_url)
        .filter(Boolean);

      if (imageUrls.length > 0) {

        updateData.images = imageUrls;
        updateData.img = imageUrls[0];

      }
    }

    const updatedGame =
      await Game.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true
        }
      );

    res.json(updatedGame);

  } catch (err) {

    console.error('EDIT GAME ERROR:', err);

    res.status(500).json({
      error: 'Failed to update game'
    });

  }
};
// ─── DELETE GAME ─────────────────────────────────────────────────
const deleteGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    if (req.user.role === 'Store') {
      const storeId = req.user.storeID || req.user._id?.toString();
      const gameStoreId = game.storeID?.toString();
      if (!storeId || storeId !== gameStoreId) {
        return res.status(403).json({ error: 'You are not allowed to delete this game' });
      }
    }

    await Game.findByIdAndDelete(req.params.id);
    res.json({ message: 'Game deleted successfully' });
  } catch (err) {
    console.log('DELETE GAME ERROR:', err);
    res.status(500).json({ error: err.message || 'Failed to delete game' });
  }
};
// ─── GET MY GAMES ────────────────────────────────────────────────

const getMyGames = async (req, res) => {
  try {

    if (!req.user || !req.user.storeID) {
      return res.status(403).json({
        error: 'Store account required'
      });
    }

    const games = await Game.find({
      storeID: req.user.storeID
    });

    return res.status(200).json({
      status: 'success',
      results: games.length,
      data: { games }
    });

  } catch (err) {

    console.error('GET MY GAMES ERROR:', err);

    return res.status(500).json({
      error: 'Failed to fetch games'
    });
  }
};
module.exports = { getAllGames, getOneGame, addGame, editGame, deleteGame, getMyGames };