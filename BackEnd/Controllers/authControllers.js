const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 📝 REGISTER USER / STORE
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, storeID } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Business rule validation: Stores MUST provide a storeID
    if (role === 'Store' && !storeID) {
      return res.status(400).json({ message: 'Store accounts require a unique storeID code' });
    }

    // Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user to Atlas database
    const newUser = new User({
      name,
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

// 🔑 LOGIN USER / STORE
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password credentials' });
    }

    // Generate secure web token (JWT) containing their Identity and Role
    const token = jwt.sign(
      { id: user._id, role: user.role, storeID: user.storeID || null },
      process.env.JWT_SECRET || 'fallback_super_secret_key',
      { expiresIn: '1d' }
    );

    // Send data back to frontend dashboard
    res.status(200).json({
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeID: user.storeID
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};