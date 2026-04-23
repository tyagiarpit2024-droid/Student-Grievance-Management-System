const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

const authRoutes = require('./routes/auth');
const grievanceRoutes = require('./routes/grievances');

const app = express();

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================
// Enable Cross-Origin Resource Sharing (CORS) so the React frontend can communicate with this API
app.use(cors());
// Parse incoming JSON payloads in the request body
app.use(express.json());

// ==========================================
// ROUTE REGISTRATION
// ==========================================
// Authentication routes (Register & Login)
app.use('/api/auth', authRoutes); // Note: Changing to /api/auth for cleaner structure, matching common conventions
// Grievance routes (Protected)
app.use('/api/grievances', grievanceRoutes);

// ==========================================
// GLOBAL ERROR HANDLING MIDDLEWARE
// ==========================================
// Catches unhandled errors and ensures the API returns a proper JSON response instead of crashing or sending HTML
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'An internal server error occurred!', 
        error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
});

// ==========================================
// DATABASE CONNECTION & SERVER START
// ==========================================
// Ensure MongoDB connection is correct using environment variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("FATAL ERROR: MONGO_URI is not defined in .env file.");
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully.');
        // Start the server only after a successful database connection
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
    });
