const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    type: {
        type: String,
        default: 'announcement',
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        default: '/',
    },
    read: {
        type: Boolean,
        default: false,
    },
    source: {
        type: String,
        enum: ['announcement', 'system'],
        default: 'announcement',
    },
    admin_notification_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification',
        default: null,
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    timestamps: true,
});

userNotificationSchema.index({ user_id: 1, read: 1 });
userNotificationSchema.index({ user_id: 1, createdAt: -1 });

module.exports = mongoose.model('UserNotification', userNotificationSchema);
