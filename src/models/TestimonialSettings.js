const mongoose = require('mongoose');

const testimonialSettingsSchema = new mongoose.Schema({
    breadcrumb_title: { type: String, default: 'Testimonial' },
    heading_before: { type: String, default: 'What Our ' },
    heading_highlight: { type: String, default: "Students & Parents Say's" },
    heading_description: {
        type: String,
        default: 'Below are a few words from students and parents who have studied with EDUSN.',
    },
    homepage_heading_before: { type: String, default: 'What Our ' },
    homepage_heading_highlight: { type: String, default: 'Students & Parents Say' },
    homepage_subtitle: {
        type: String,
        default: 'Real experiences from our EDUSN community',
    },
}, { timestamps: true });

module.exports = mongoose.model('TestimonialSettings', testimonialSettingsSchema);
