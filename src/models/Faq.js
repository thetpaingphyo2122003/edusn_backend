// src/models/Faq.js
const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['page_info', 'faq'],
        default: 'faq'
    },
    category: {
        type: String,
        enum: ['General', 'Admissions', 'Curriculum', 'Virtual School', 'OnCampus', 'IGCSE'],
        default: 'General'
    },
    question: {
        type: String,
        default: null
    },
    answer: {
        type: String,
        default: null
    },
    title: {
        type: String,
        default: null
    },
    content: {
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
    },
    extra_data: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for faster queries
faqSchema.index({ category: 1, display_order: 1 });
faqSchema.index({ status: 1 });
faqSchema.index({ question: 'text', answer: 'text' });

module.exports = mongoose.model('Faq', faqSchema);