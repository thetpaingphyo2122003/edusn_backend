// src/models/Subject.js
const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['key_stage_1', 'key_stage_2', 'year_1', 'year_2']
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    age_range: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    content: {
        type: String,
        default: null
    },
    image: {
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
subjectSchema.index({ category: 1, display_order: 1 });
subjectSchema.index({ status: 1 });
subjectSchema.index({ title: 1 });

module.exports = mongoose.model('Subject', subjectSchema);