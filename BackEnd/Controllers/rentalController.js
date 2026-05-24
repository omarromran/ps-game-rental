const Rental = require('../models/Rental');
const Game = require('../models/Game');

// Checkout — create rental
const checkout = async (req, res) => {
    try {
        const { gameId, days } = req.body;

        // Validation
        if (!req.session.user) {
            return res.status(401).json({ error: 'You must be logged in to rent' });
        }
        if (!gameId || gameId.trim() === '') {
            return res.status(400).json({ error: 'Game ID is required' });
        }
        if (!days) {
            return res.status(400).json({ error: 'Number of days is required' });
        }
        if (isNaN(days) || days < 1) {
            return res.status(400).json({ error: 'Number of days must be at least 1' });
        }
        if (days > 30) {
            return res.status(400).json({ error: 'Maximum rental period is 30 days' });
        }

        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        if (game.status !== 'Available') {
            return res.status(400).json({ error: 'Game is not available for rent' });
        }

        // Check if user already has an active rental for this game
        const existingRental = await Rental.findOne({
            customer: req.session.user._id,
            game: gameId,
            status: 'active'
        });
        if (existingRental) {
            return res.status(400).json({ error: 'You already have an active rental for this game' });
        }

        const startDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + parseInt(days));

        const totalPrice = game.pricePerDay * days;

        const rental = new Rental({
            customer: req.session.user._id,
            game: gameId,
            startDate,
            dueDate,
            pricePerDay: game.pricePerDay,
            totalPrice,
            status: 'active'
        });

        await rental.save();

        // Mark game as rented
        await Game.findByIdAndUpdate(gameId, {
            status: 'Rented',
            customerID: req.session.user._id
        });

        res.status(201).json({
            message: 'Rental confirmed!',
            rental
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Checkout failed' });
    }
};

// Get my rentals
const getMyRentals = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not logged in' });
        }

        const rentals = await Rental.find({ customer: req.session.user._id })
            .populate('game', 'title img platform pricePerDay')
            .sort({ createdAt: -1 });

        res.json(rentals);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to fetch rentals' });
    }
};

// Return a game
const returnGame = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Not logged in' });
        }

        if (!req.params.id) {
            return res.status(400).json({ error: 'Rental ID is required' });
        }

        const rental = await Rental.findById(req.params.id);
        if (!rental) {
            return res.status(404).json({ error: 'Rental not found' });
        }

        if (rental.customer.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ error: 'This is not your rental' });
        }

        if (rental.status === 'returned') {
            return res.status(400).json({ error: 'Game already returned' });
        }

        rental.status = 'returned';
        await rental.save();

        // Mark game as available again
        await Game.findByIdAndUpdate(rental.game, {
            status: 'Available',
            customerID: null
        });

        res.json({ message: 'Game returned successfully', rental });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to return game' });
    }
};

// Admin — get all rentals
const getAllRentals = async (req, res) => {
    try {
        const rentals = await Rental.find()
            .populate('customer', 'username email')
            .populate('game', 'title platform')
            .sort({ createdAt: -1 });

        res.json(rentals);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to fetch rentals' });
    }
};

module.exports = { checkout, getMyRentals, returnGame, getAllRentals };