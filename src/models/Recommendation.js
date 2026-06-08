// src/models/Recommendation.js
const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
    hash: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    dateOfIssue: {
        type: String,
        default: null
    },
    subject: {
        type: String,
        default: null
    },
    nrc: {
        type: String,
        default: null
    },
    nrcid: {
        type: String,
        default: null
    },
    para1: {
        type: String,
        default: null
    },
    para2: {
        type: String,
        default: null
    },
    para3: {
        type: String,
        default: null
    },
    para4: {
        type: String,
        default: null
    },
    para5: {
        type: String,
        default: null
    },
    sign: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Recommendation', recommendationSchema);
