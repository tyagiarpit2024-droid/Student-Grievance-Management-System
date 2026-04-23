const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (Student)
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Basic validation: Ensure all fields are provided
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields (name, email, password).' });
        }

        // 2. Check for Duplicate Email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
        }

        // 3. Hash the password using bcrypt for security
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create and save the new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword // Save the hashed password, NEVER plain text
        });

        const savedUser = await newUser.save();

        // 5. Return success response (excluding password)
        res.status(201).json({ 
            success: true, 
            message: 'User registered successfully.', 
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email
            }
        });

    } catch (err) {
        // Catch any Mongoose validation errors or server issues
        console.error("Registration Error:", err);
        res.status(500).json({ success: false, message: 'Server error during registration.', error: err.message });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validation
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
        }

        // 2. Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            // Invalid login - User not found
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // 3. Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Invalid login - Password mismatch
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // 4. Generate JWT Token
        // Payload contains the user ID, so we can identify the user on protected routes
        const payload = { id: user._id };
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' } // Token expires in 1 day
        );

        // 5. Return successful login response with token
        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, message: 'Server error during login.', error: err.message });
    }
});

module.exports = router;
