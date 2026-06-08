// src/models/Testimonial.js
const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['Student', 'Parent'],
        default: 'Student'
    },
    message: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        default: null
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    display_order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes for faster queries
testimonialSchema.index({ status: 1, display_order: 1 });
testimonialSchema.index({ rating: -1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);