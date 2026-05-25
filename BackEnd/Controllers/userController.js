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
        const { username, email, password } = req.body;
        const updateData = {};

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
const deleteUser = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to delete user' });
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

        if (user.role !== 'StoreOwner') {
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