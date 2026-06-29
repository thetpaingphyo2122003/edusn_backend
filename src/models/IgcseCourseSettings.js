const mongoose = require('mongoose');

const igcseCourseSettingsSchema = new mongoose.Schema({
    parent_breadcrumb_title: { type: String, default: 'IGCSE' },
    parent_breadcrumb_path: { type: String, default: '/secondary/upper' },
    show_parent_in_breadcrumb: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('IgcseCourseSettings', igcseCourseSettingsSchema);
