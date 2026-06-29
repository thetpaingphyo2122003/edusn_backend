// src/models/Subject.js
const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['key_stage_1', 'key_stage_2', 'year_1', 'year_2', 'lower_secondary', 'upper_secondary']
    },
    year: {
        type: String,
        enum: ['year_1', 'year_2', 'year_3', 'year_4', 'year_5', 'year_6', 'year_7', 'year_8', 'year_9', 'year_10', 'year_11', null],
        default: null
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
    subject_group: {
        type: String,
        default: null
    },
    list_column: {
        type: Number,
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