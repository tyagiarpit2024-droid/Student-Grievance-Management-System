const express = require('express');
const router = express.Router();
const Grievance = require('../models/Grievance');
const auth = require('../middleware/auth');

/**
 * MIDDLEWARE: Protect all grievance routes
 * By using router.use(auth) at the top, every route below it will require a valid JWT.
 * If the user is not authenticated, the request will be rejected by the middleware.
 */
router.use(auth);

/**
 * @route   POST /api/grievances
 * @desc    Submit a new grievance
 * @access  Private (Requires JWT)
 */
router.post('/', async (req, res) => {
    try {
        const { title, description, category } = req.body;

        // Validation
        if (!title || !description || !category) {
            return res.status(400).json({ success: false, message: 'Title, description, and category are required.' });
        }

        // Create new grievance. Note that 'userId' comes from the auth middleware (req.user)
        const newGrievance = new Grievance({
            title,
            description,
            category,
            userId: req.user 
        });

        const savedGrievance = await newGrievance.save();
        res.status(201).json({ success: true, message: 'Grievance submitted successfully.', data: savedGrievance });
    } catch (err) {
        console.error("Error creating grievance:", err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
});

/**
 * @route   GET /api/grievances/search?title=xyz
 * @desc    Search grievances by title for the logged-in user
 * @access  Private (Requires JWT)
 * NOTE: This route must come BEFORE /:id to prevent Express from treating "search" as an ID
 */
router.get('/search', async (req, res) => {
    try {
        const { title } = req.query;
        if (!title) {
            return res.status(400).json({ success: false, message: 'Search title query parameter is required.' });
        }

        // Search for grievances matching the title (case-insensitive) belonging to the current user
        const grievances = await Grievance.find({
            userId: req.user,
            title: { $regex: title, $options: 'i' } 
        }).sort({ date: -1 });

        res.status(200).json({ success: true, count: grievances.length, data: grievances });
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ success: false, message: 'Server error during search.', error: err.message });
    }
});

/**
 * @route   GET /api/grievances
 * @desc    Fetch all grievances belonging to the logged-in user
 * @access  Private (Requires JWT)
 */
router.get('/', async (req, res) => {
    try {
        // Fetch only grievances created by the authenticated user, sorted by newest first
        const grievances = await Grievance.find({ userId: req.user }).sort({ date: -1 });
        res.status(200).json({ success: true, count: grievances.length, data: grievances });
    } catch (err) {
        console.error("Fetch grievances error:", err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
});

/**
 * @route   GET /api/grievances/:id
 * @desc    Fetch a specific grievance by its ID
 * @access  Private (Requires JWT)
 */
router.get('/:id', async (req, res) => {
    try {
        // Find the grievance by ID AND ensure it belongs to the requesting user
        const grievance = await Grievance.findOne({ _id: req.params.id, userId: req.user });
        
        if (!grievance) {
            return res.status(404).json({ success: false, message: 'Grievance not found or you do not have permission to view it.' });
        }
        res.status(200).json({ success: true, data: grievance });
    } catch (err) {
        console.error("Fetch specific grievance error:", err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
});

/**
 * @route   PUT /api/grievances/:id
 * @desc    Update a specific grievance
 * @access  Private (Requires JWT)
 */
router.put('/:id', async (req, res) => {
    try {
        const { title, description, category, status } = req.body;

        // Find the grievance and update it, ensuring the user owns it
        const updatedGrievance = await Grievance.findOneAndUpdate(
            { _id: req.params.id, userId: req.user },
            { title, description, category, status },
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        if (!updatedGrievance) {
            return res.status(404).json({ success: false, message: 'Grievance not found or unauthorized.' });
        }

        res.status(200).json({ success: true, message: 'Grievance updated successfully.', data: updatedGrievance });
    } catch (err) {
        console.error("Update grievance error:", err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
});

/**
 * @route   DELETE /api/grievances/:id
 * @desc    Delete a specific grievance
 * @access  Private (Requires JWT)
 */
router.delete('/:id', async (req, res) => {
    try {
        // Ensure the user owns the grievance before deleting
        const deletedGrievance = await Grievance.findOneAndDelete({ _id: req.params.id, userId: req.user });
        
        if (!deletedGrievance) {
            return res.status(404).json({ success: false, message: 'Grievance not found or unauthorized.' });
        }
        
        res.status(200).json({ success: true, message: 'Grievance deleted successfully.', data: deletedGrievance });
    } catch (err) {
        console.error("Delete grievance error:", err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
});

module.exports = router;
