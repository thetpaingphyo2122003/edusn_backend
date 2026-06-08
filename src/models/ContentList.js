// src/models/ContentList.js
const mongoose = require('mongoose');

const contentListSchema = new mongoose.Schema({
    parent_section: {
        type: String,
        required: true,
        enum: ['missions', 'offices', 'pathway', 'features', 'partners', 'quick_links']
    },
    display_order: {
        type: Number,
        default: 0
    },
    title: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    icon: {
        type: String,
        default: null
    },
    image: {
        type: String,
        default: null
    },
    extra_data: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

// Indexes for faster queries
contentListSchema.index({ parent_section: 1, display_order: 1 });
contentListSchema.index({ status: 1 });

module.exports = mongoose.model('ContentList', contentListSchema);