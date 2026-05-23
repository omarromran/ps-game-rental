const express = require('express');
const router = express.Router();
const authController = require('../Controllers/authControllers');

// Define API target addresses
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;