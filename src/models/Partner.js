// src/models/Partner.js
const mongoose = require('mongoose');
const { uploadImage, deleteImage } = require('../services/uploadService');



// Social Links Schema (embedded)
const socialLinksSchema = new mongoose.Schema({
    facebook: { type: String, default: null },
    twitter: { type: String, default: null },
    linkedin: { type: String, default: null }
});

const programRowSchema = new mongoose.Schema({
    no: { type: Number, default: 1 },
    programs: { type: String, default: null },
    intakes: { type: String, default: null },
    duration: { type: String, default: null },
    requirements: { type: String, default: null },
    fees: { type: String, default: null }
}, { _id: false });

// Main Partner Schema
const partnerSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['page_info', 'university', 'progression_route'],
        default: 'university'
    },
    name: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    logo_path: {
        type: String,
        default: null
    },
    country_category: {
        type: String,
        default: null
    },
    website_url: {
        type: String,
        default: null
    },
    pathway_tab_label: {
        type: String,
        default: null
    },
    foundation_url: {
        type: String,
        default: null
    },
    bachelor_url: {
        type: String,
        default: null
    },
    map_url: {
        type: String,
        default: null
    },
    calendly_url: {
        type: String,
        default: null
    },
    foundation_programs: {
        type: [programRowSchema],
        default: []
    },
    bachelor_programs: {
        type: [programRowSchema],
        default: []
    },
    social_links: {
        type: socialLinksSchema,
        default: () => ({})
    },
    degree_type: {
        type: String,
        default: null
    },
    university_name: {
        type: String,
        default: null
    },
    programme_name: {
        type: String,
        default: null
    },
    fees: {
        type: String,
        default: null
    },
    duration: {
        type: String,
        default: null
    },
    progression_from: {
        type: String,
        default: null
    },
    search_tags: {
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
    email: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    location: {
        type: String,
        default: null
    },
    founded: {
        type: String,
        default: null
    },
    institution_type: {
        type: String,
        default: null
    },
    global_ranking: {
        type: String,
        default: null
    },
    local_ranking: {
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
partnerSchema.index({ country_category: 1 });
partnerSchema.index({ university_name: 1 });
partnerSchema.index({ type: 1 });
partnerSchema.index({ status: 1 });

module.exports = mongoose.model('Partner', partnerSchema);