// src/models/Timetable.js
const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    academic_year: {
        type: String,
        required: true
    },
    class_name: {
        type: String,
        required: true,
        trim: true
    },
    color_class: {
        type: String,
        enum: ['bg-sky', 'bg-yellow', 'bg-lightred', 'bg-purple', 'bg-green', 'bg-cri', 'bg-hel'],
        default: 'bg-sky'
    },
    row_highlight: {
        type: Boolean,
        default: false
    },
    day_of_week: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    start_time: {
        type: String,
        required: true
    },
    end_time: {
        type: String,
        required: true
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
timetableSchema.index({ academic_year: 1, class_name: 1 });
timetableSchema.index({ day_of_week: 1 });
timetableSchema.index({ status: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);