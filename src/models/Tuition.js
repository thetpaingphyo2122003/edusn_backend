// src/models/Tuition.js
const mongoose = require('mongoose');

// Installment Schema (embedded)
const installmentSchema = new mongoose.Schema({
    number: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
});

// Bank Account Schema (embedded)
const bankAccountSchema = new mongoose.Schema({
    account_name: {
        type: String,
        default: null
    },
    account_number: {
        type: String,
        default: null
    },
    company: {
        type: String,
        default: null
    },
    qr_code_image: {
        type: String,
        default: null
    },
    bank_logo: {
        type: String,
        default: null
    }
});

// Main Tuition Schema
const tuitionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['page_info', 'fee', 'payment_info', 'virtual_attendance'],
        default: 'fee'
    },
    category: {
        type: String,
        enum: ['gcse_a_level', 'virtual', 'campus'],
        default: null
    },
    program_name: {
        type: String,
        default: null
    },
    year_level: {
        type: String,
        default: null
    },
    total_fees_mmk: {
        type: Number,
        default: null
    },
    material_fees_mmk: {
        type: Number,
        default: 0
    },
    microsoft_fees_mmk: {
        type: Number,
        default: 0
    },
    installments: [installmentSchema],
    installment_note: {
        type: String,
        default: null
    },
    scholarship_note: {
        type: String,
        default: null
    },
    bank_accounts: [bankAccountSchema],
    title: {
        type: String,
        default: null
    },
    content: {
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
tuitionSchema.index({ category: 1, display_order: 1 });
tuitionSchema.index({ type: 1 });
tuitionSchema.index({ status: 1 });

module.exports = mongoose.model('Tuition', tuitionSchema);