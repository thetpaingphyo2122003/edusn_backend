const mongoose = require('mongoose');

// Tab Schema (embedded)
const tabSchema = new mongoose.Schema({
    tab_key: {
        type: String,
        required: true
    },
    tab_title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        default: null
    }
});

// Main IgcseCourse Schema
const igcseCourseSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        enum: ['IGCSE', 'A_LEVEL', 'AS_A_LEVEL']
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        sparse: true
    },
    thumbnail: {
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
    tabs: [tabSchema]
}, {
    timestamps: true
});

// Slug generation
igcseCourseSchema.pre('save', async function() {
    if (!this.isModified('title') || !this.title) return;
    
    let baseSlug = this.title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    const IgcseCourse = mongoose.model('IgcseCourse');
    let existingCourse = await IgcseCourse.findOne({ slug: slug });
    
    while (existingCourse && existingCourse._id.toString() !== this._id?.toString()) {
        slug = `${baseSlug}-${counter}`;
        counter++;
        existingCourse = await IgcseCourse.findOne({ slug: slug });
    }
    
    this.slug = slug;
});

// Indexes
igcseCourseSchema.index({ category: 1, display_order: 1 });
igcseCourseSchema.index({ status: 1 });

module.exports = mongoose.model('IgcseCourse', igcseCourseSchema);