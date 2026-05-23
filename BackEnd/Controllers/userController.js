const User = require('../models/User');
const bcrypt = require('bcryptjs');

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

        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (password) updateData.password = await bcrypt.hash(password, 10);

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
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { approved: true },
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ message: 'Store owner approved', user });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to approve store owner' });
    }
};

// Suspend user (admin)
const suspendUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { suspended: true },
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ message: 'User suspended', user });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to suspend user' });
    }
};

module.exports = { getAllUsers, getUser, updateUser, deleteUser, approveStore, suspendUser };