const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Email format checker
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validation
    if (!username || username.trim() === '') {
      return res.status(400).json({ message: 'Username is required' });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }
    if (!email || email.trim() === '') {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (!password || password.trim() === '') {
      return res.status(400).json({ message: 'Password is required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!role || role.trim() === '') {
      return res.status(400).json({ message: 'Role is required' });
    }
    if (!['Gamer', 'Store', 'Admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be Gamer, Store, or Admin' });
    }
    // Store ID will be set after saving user (no custom generation needed)    };

    // Check duplicates
    const normalizedEmail = email.trim().toLowerCase();
    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const normalizedUsername = username.trim();
    const usernameExists = await User.findOne({ username: normalizedUsername });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // storeID will be set after user is saved

    const newUser = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,

      // Only stores need approval
      approved: role !== 'Store'
    });

    // Make storeID equal to user _id for stores
    if (role === 'Store') {
      newUser.storeID = newUser._id.toString();
    }

    await newUser.save();

    if (role === 'Store') {
      return res.status(201).json({
        message: 'Store registered successfully! Waiting for Admin approval before login.',
        user: newUser
      });
    }

    res.status(201).json({ message: 'User registered successfully! Proceed to login.' });

  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || email.trim() === '') {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (!password || password.trim() === '') {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password credentials' });
    }

    // Block unapproved stores
    if (user.role === 'Store' && !user.approved) {
      return res.status(403).json({
        message: 'Your store account is waiting for admin approval.'
      });
    }

    // Check if suspended
    if (user.suspended) {
      return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, storeID: user.storeID || null },
      process.env.JWT_SECRET || 'fallback_super_secret_key',
      { expiresIn: '1d' }
    );

    req.session.user = { _id: user._id, username: user.username, email: user.email, role: user.role };

    res.status(200).json({
      message: `Welcome back, ${user.username}!`,
      token,
      user: {
        _id: user._id,
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        storeID: user.storeID
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// 🚪 POST /api/auth/logout (Stateless JWT Version)
exports.logout = (req, res) => {
  // Since JWT tokens are stored on the client side, the server just sends a success 
  // confirmation instructing the frontend application to delete its stored token.
  res.status(200).json({
    message: 'Logged out successfully. Please remove your token from storage.'
  });
};

exports.getMe = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
};