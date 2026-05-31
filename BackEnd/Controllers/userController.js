const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Email format checker
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Get all users (admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Get one user profile
const getUser = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

// Edit profile
const updateUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const updateData = {};

        if (
  req.user.role !== 'Admin' &&
  req.user._id.toString() !== req.params.id
) {
  return res.status(403).json({
    error: 'Not authorized'
  });
}

        // Validation
        if (username !== undefined) {
            if (username.trim() === '') {
                return res.status(400).json({ error: 'Username cannot be empty' });
            }
            if (username.trim().length < 3) {
                return res.status(400).json({ error: 'Username must be at least 3 characters' });
            }
            // Check duplicate username
            const existingUser = await User.findOne({
                username: username.trim(),
                _id: { $ne: req.params.id }
            });
            if (existingUser) {
                return res.status(400).json({ error: 'Username is already taken' });
            }
            updateData.username = username.trim();
        }

        if (email !== undefined) {
            if (email.trim() === '') {
                return res.status(400).json({ error: 'Email cannot be empty' });
            }
            if (!isValidEmail(email)) {
                return res.status(400).json({ error: 'Please enter a valid email address' });
            }
            // Check duplicate email
            const existingEmail = await User.findOne({
                email: email.trim().toLowerCase(),
                _id: { $ne: req.params.id }
            });
            if (existingEmail) {
                return res.status(400).json({ error: 'Email is already in use' });
            }
            updateData.email = email.trim().toLowerCase();
        }

        if (password !== undefined) {
            if (password.trim() === '') {
                return res.status(400).json({ error: 'Password cannot be empty' });
            }
            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Allow updating phone number
        if (req.body.phone !== undefined) {

    const phone = String(req.body.phone || '').trim();

    const egyptPhoneRegex = /^01[0125][0-9]{8}$/;

    if (
        phone &&
        !egyptPhoneRegex.test(phone)
    ) {
        return res.status(400).json({
            error: 'Invalid Egyptian phone number'
        });
    }

    updateData.phone = phone;
}

        if (role !== undefined) {

    if (req.user.role !== 'Admin') {
        return res.status(403).json({
            error: 'Only admins can change roles'
        });
    }

    if (!['Gamer', 'Store', 'Admin'].includes(role)) {
        return res.status(400).json({
            error: 'Role must be Gamer, Store, or Admin'
        });
    }

    updateData.role = role;
}

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided to update' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ message: 'Profile updated', user });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

// Delete user (admin)
const Game = require('../models/Game');
const Rental = require('../models/Rental');

// Delete user (admin) with transaction-safe cascade
const deleteUser = async (req, res) => {
    let session = null;
    try {
        if (!req.params.id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // start a mongoose session for transaction
        session = await User.startSession();
        await session.withTransaction(async () => {
            // load user within the transaction
            const user = await User.findById(req.params.id).session(session);
            if (!user) {
                // throwing will abort the transaction
                throw { status: 404, message: 'User not found' };
            }

            // If deleted user is a Store, delete their games
            if (user.role === 'Store' ){
                const storeIdentifier = user.storeID || String(user._id);
                const deleteResult = await Game.deleteMany({ storeID: storeIdentifier }).session(session);
                console.log(`Deleted ${deleteResult.deletedCount} games for store ${storeIdentifier}`);
            }

            // If deleted user is a Gamer, mark their active rentals as returned and free the games
            if (user.role === 'Gamer') {
                const activeRentals = await Rental.find({ customer: user._id, status: 'active' }).session(session);
                for (const r of activeRentals) {
                    await Rental.findByIdAndUpdate(r._id, { status: 'returned' }, { session });
                    await Game.findByIdAndUpdate(r.game, { status: 'Available', customerID: null }, { session });
                }
                console.log(`Processed ${activeRentals.length} active rentals for deleted gamer ${user._id}`);
            }

            // finally delete the user record itself
            await User.deleteOne({ _id: user._id }).session(session);
        });

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.log(err);
        if (err && err.status === 404) return res.status(404).json({ error: err.message });
        res.status(500).json({ error: 'Failed to delete user' });
    } finally {
        if (session) session.endSession();
    }
};

// Approve store owner (admin)
const approveStore = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.role !== 'Store') {
            return res.status(400).json({ error: 'This user is not a store owner' });
        }

        if (user.approved) {
            return res.status(400).json({ error: 'Store owner is already approved' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { approved: true },
            { new: true }
        ).select('-password');

        res.json({ message: 'Store owner approved', user: updatedUser });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to approve store owner' });
    }
};

// Suspend user (admin)
const suspendUser = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.suspended) {
            return res.status(400).json({ error: 'User is already suspended' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { suspended: true },
            { new: true }
        ).select('-password');

        res.json({ message: 'User suspended', user: updatedUser });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to suspend user' });
    }
};

module.exports = { getAllUsers, getUser, updateUser, deleteUser, approveStore, suspendUser };