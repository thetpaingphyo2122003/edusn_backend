// src/models/Blog.js
const mongoose = require('mongoose');

const reactionCountsSchema = new mongoose.Schema({
    like: { type: Number, default: 0 },
    love: { type: Number, default: 0 },
    celebrate: { type: Number, default: 0 },
}, { _id: false });

const userReactionSchema = new mongoose.Schema({
    user_key: { type: String, required: true },
    reaction: { type: String, enum: ['like', 'love', 'celebrate'], required: true },
}, { _id: false });

// Reply Schema (embedded in comments)
const replySchema = new mongoose.Schema({
    user_name: { type: String, required: true },
    user_email: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'spam'], default: 'pending' },
    reactions: { type: reactionCountsSchema, default: () => ({}) },
    reacted_users: [{ type: String }],
    user_reactions: [userReactionSchema],
}, { timestamps: true });

// Comment Schema (embedded)
const commentSchema = new mongoose.Schema({
    user_name: { type: String, required: true },
    user_email: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'spam'], default: 'pending' },
    reactions: { type: reactionCountsSchema, default: () => ({}) },
    reacted_users: [{ type: String }],
    user_reactions: [userReactionSchema],
    replies: [replySchema],
}, { timestamps: true });

// SEO Schema (embedded)
const seoSchema = new mongoose.Schema({
    meta_title: { type: String, default: null },
    meta_description: { type: String, default: null },
    meta_keywords: { type: String, default: null },
    canonical_url: { type: String, default: null }
});

// Main Blog Schema
const blogSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true, sparse: true },
    content: { type: String, required: true },
    excerpt: { type: String, default: null },
    featured_image: { type: String, default: null },
    gallery_images: [{ type: String }],
    author: {
        name: { type: String, default: 'EDUSN' },
        avatar: { type: String, default: null },
        role: { type: String, default: 'Admin' }
    },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    category: { type: String, default: 'general' },
    tags: [{ type: String }],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    published_date: { type: Date, default: null },
    view_count: { type: Number, default: 0 },
    like_count: { type: Number, default: 0 },
    share_count: { type: Number, default: 0 },
    reactions: { type: reactionCountsSchema, default: () => ({}) },
    reacted_users: [{ type: String }],
    user_reactions: [userReactionSchema],
    comments: [commentSchema],
    seo: { type: seoSchema, default: () => ({}) }
}, { timestamps: true });

// ✅ Mongoose v7+ အတွက် မှန်ကန်တဲ့ syntax (next မပါ)
blogSchema.pre('save', async function() {
    // Slug ကို title ပြောင်းမှသာ generate လုပ်
    if (!this.isModified('title') || !this.title) return;
    
    // Generate base slug
    let baseSlug = this.title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    // Check if slug already exists
    const Blog = mongoose.model('Blog');
    let existingBlog = await Blog.findOne({ slug: slug });
    
    // If slug exists, add number suffix
    while (existingBlog && existingBlog._id.toString() !== this._id?.toString()) {
        slug = `${baseSlug}-${counter}`;
        counter++;
        existingBlog = await Blog.findOne({ slug: slug });
    }
    
    this.slug = slug;
});

// Indexes
// blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1, published_date: -1 });
blogSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Blog', blogSchema);