const jwt = require('jsonwebtoken');
const User = require('../Models/User'); // Ensure 'Models' matches your user schema folder casing!

// 🔒 GATEKEEPER 1: Verify the user is logged in
exports.protect = async (req, res, next) => {
  let token;

  // Check if the request contains a Bearer token in the authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from string ("Bearer eyJhbGciOi...")
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify token using your secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_super_secret_key');

      // Fetch the user from the database and attach them to the request object (excluding password)
      req.user = await User.findById(decoded.id).select('-password');
      
      return next(); // 🎉 Access granted! Move to the next code block.
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, security token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No login token found.' });
  }
};

// 🎭 GATEKEEPER 2: Restrict routes based on account roles ('Customer', 'Store', 'Admin')
exports.restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user was placed there by the protect middleware above
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access Denied. Your account role is not authorized to view this resource.` 
      });
    }
    next(); // 🎉 Access granted!
  };
};