const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['blog', 'testimonial', 'award', 'partner', 'tuition', 'user', 'course', 'leadership', 'faq', 'history', 'timetable', 'content']
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    link: {
        type: String,
        required: true
    },
    reference_id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'reference_model',
        default: null
    },
    reference_model: {
        type: String,
        enum: ['Blog', 'Testimonial', 'Award', 'Partner', 'Tuition', 'User', 'IgcseCourse', 'Leader', 'Faq', 'History', 'Timetable', 'ContentList'],
        default: null
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Indexes for faster queries
notificationSchema.index({ read: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ created_by: 1 });

// ✅ Just export the model - DO NOT try to reference or create User here
module.exports = mongoose.model('Notification', notificationSchema);