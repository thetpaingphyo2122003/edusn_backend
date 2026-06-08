// src/models/Award.js
const mongoose = require('mongoose');

const awardSchema = new mongoose.Schema({
    academic_year: {
        type: String,
        required: true
    },
    campus: {
        type: String,
        default: null
    },
    award_category: {
        type: String,
        default: null
    },
    sub_category: {
        type: String,
        default: null
    },
    award_title: {
        type: String,
        default: null
    },
    student_name: {
        type: String,
        default: null
    },
    grade_year: {
        type: String,
        default: null
    },
    teacher_name: {
        type: String,
        default: null
    },
    subject: {
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

// Indexes for faster queries
awardSchema.index({ academic_year: 1, campus: 1 });
awardSchema.index({ award_category: 1 });
awardSchema.index({ status: 1 });

module.exports = mongoose.model('Award', awardSchema);