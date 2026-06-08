// src/models/History.js
const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['page_info', 'timeline'],
        default: 'timeline'
    },
    year: {
        type: Number,
        default: null
    },
    title: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    main_image: {
        type: String,
        default: null
    },
    gallery_images: [{
        type: String
    }],
    video_url: {
        type: String,
        default: null
    },
    banner_image: {
        type: String,
        default: null
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
}, {
    timestamps: true
});

// Indexes
historySchema.index({ year: 1 });
historySchema.index({ status: 1 });
historySchema.index({ display_order: 1 });

module.exports = mongoose.model('History', historySchema);