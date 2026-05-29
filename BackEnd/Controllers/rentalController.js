const mongoose = require('mongoose');
const Rental = require('../models/Rental');
const Game = require('../models/Game');

// Checkout — create rental
const checkout = async (req, res) => {
    try {
        const { items, phone, address } = req.body;

        if (!req.session.user) {
            return res.status(401).json({ error: 'You must be logged in to rent' });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart items are required' });
        }

        if (!phone || !address) {
            return res.status(400).json({ error: 'Phone and address are required' });
        }

        const normalizedItems = items.map(item => ({
            gameId: String(item.gameId || item._id || item.gameID || item.id || ''),
            days: Number(item.days || item.duration || 1)
        }));

        const badItem = normalizedItems.find(item => !item.gameId || isNaN(item.days) || item.days < 1 || item.days > 30);
        if (badItem) {
            return res.status(400).json({ error: 'Each rental item must include a valid gameId and days between 1 and 30' });
        }

        const gameIds = normalizedItems.map(item => item.gameId);
        const games = await Game.find({
            $or: [
                { _id: { $in: gameIds.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
                { gameID: { $in: gameIds } }
            ]
        });

        if (games.length !== normalizedItems.length) {
            return res.status(404).json({ error: 'One or more games were not found or are unavailable' });
        }

        const rentalDocs = [];
        const updates = [];

        for (const item of normalizedItems) {
            const game = games.find(g => String(g._id) === item.gameId || String(g.gameID) === item.gameId);
            if (!game) {
                return res.status(404).json({ error: `Game ${item.gameId} not found` });
            }

            if ((game.status || '').toLowerCase() !== 'available') {
                return res.status(400).json({ error: `${game.title || 'Game'} is not available to rent` });
            }

            const existingRental = await Rental.findOne({
                customer: req.session.user._id,
                game: game._id,
                status: 'active'
            });
            if (existingRental) {
                return res.status(400).json({ error: `You already have an active rental for ${game.title}` });
            }

            const startDate = new Date();
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + item.days);

            rentalDocs.push({
                customer: req.session.user._id,
                game: game._id,
                startDate,
                dueDate,
                pricePerDay: game.pricePerDay,
                totalPrice: game.pricePerDay * item.days,
                phone,
                address,
                status: 'active'
            });

            updates.push({
                updateOne: {
                    filter: { _id: game._id },
                    update: { status: 'Rented', customerID: req.session.user._id }
                }
            });
        }

        const rentals = await Rental.insertMany(rentalDocs);
        await Game.bulkWrite(updates);

        res.status(201).json({
            message: 'Rental confirmed!',
            rentals
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