// src/models/ContactInfo.js
const mongoose = require('mongoose');

const contactInfoSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['campus', 'office']
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    sub_title: {
        type: String,
        default: null
    },
    address: {
        type: String,
        default: null
    },
    emails: {
        general: { type: String, default: null },
        office: { type: String, default: null },
        support: { type: String, default: null },
        admissions: { type: String, default: null }
    },
    phones: {
        main: { type: String, default: null },
        hotline: { type: String, default: null },
        emergency: { type: String, default: null }
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
contactInfoSchema.index({ type: 1, display_order: 1 });
contactInfoSchema.index({ status: 1 });
contactInfoSchema.index({ name: 1 });

module.exports = mongoose.model('ContactInfo', contactInfoSchema);