const mongoose = require('mongoose');

// Define the schema for the Grievance collection in MongoDB
const grievanceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    category: {
        type: String,
        enum: ['Academic', 'Hostel', 'Transport', 'Other'], // Restrict to these specific categories
        required: [true, 'Category is required']
    },
    date: {
        type: Date,
        default: Date.now // Automatically sets the submission date to now
    },
    status: {
        type: String,
        enum: ['Pending', 'Resolved'], // Default status is Pending
        default: 'Pending'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Creates a relation to the User model
        ref: 'User',
        required: true
    }
}, { 
    timestamps: true // Automatically creates 'createdAt' and 'updatedAt' fields
});

module.exports = mongoose.model('Grievance', grievanceSchema);
