const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['hero', 'mission', 'culture', 'features', 'statistics', 'partners', 'cta', 'about', 'gallery', 'testimonials', 'contact']
    },
    order: {
        type: Number,
        default: 0
    },
    props: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
});

const dynamicPageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    seo: {
        title: { type: String, default: null },
        description: { type: String, default: null },
        keywords: { type: String, default: null },
        og_image: { type: String, default: null }
    },
    sections: [sectionSchema],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    template: {
        type: String,
        enum: ['default', 'full-width', 'landing', 'minimal'],
        default: 'default'
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    published_at: {
        type: Date,
        default: null
    }   
}, {
    timestamps: true
});

// Indexes
dynamicPageSchema.index({ status: 1 });
dynamicPageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DynamicPage', dynamicPageSchema);