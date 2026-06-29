const mongoose = require('mongoose');

const blogSettingsSchema = new mongoose.Schema({
    breadcrumb_title: { type: String, default: 'Our Blog' },
    detail_breadcrumb_title: { type: String, default: 'Blog' },
    homepage_sub_title: { type: String, default: 'News & Blog' },
    homepage_heading_before: { type: String, default: 'Latest News & ' },
    homepage_heading_highlight: { type: String, default: 'Blog' },
    homepage_description: {
        type: String,
        default: 'Keep up with the latest news, tips and inspiration from EDUSN International School',
    },
    homepage_button_text: { type: String, default: 'View More Our Blogs' },
}, { timestamps: true });

module.exports = mongoose.model('BlogSettings', blogSettingsSchema);
