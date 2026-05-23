const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


exports.register = async (req, res) => {
  try {
    const { username, email, password, role, storeID } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    if (role === 'Store' && !storeID) {
      return res.status(400).json({ message: 'Store accounts require a unique storeID code' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      storeID: role === 'Store' ? storeID : undefined
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully! Proceed to login.' });

  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password credentials' });
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


exports.logout = (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
};

exports.getMe = (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    res.json(req.session.user);
};