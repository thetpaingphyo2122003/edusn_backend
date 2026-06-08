// src/models/Leader.js
const mongoose = require('mongoose');

const leaderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    position: {
        type: String,
        required: true,
        trim: true
    },
    qualification: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        default: null
    },
    photo: {
        type: String,
        default: null
    },
    email: {
        type: String,
        default: null,
        lowercase: true,
        trim: true
    },
    display_order: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
});

// Indexes
leaderSchema.index({ status: 1, display_order: 1 });
leaderSchema.index({ position: 1 });

module.exports = mongoose.model('Leader', leaderSchema);