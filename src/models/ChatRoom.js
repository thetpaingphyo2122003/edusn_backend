// src/models/ChatRoom.js
const mongoose = require('mongoose');

// Participant Schema (embedded)
const participantSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: null
    },
    role: {
        type: String,
        default: null
    },
    last_read_at: {
        type: Date,
        default: Date.now
    },
    is_muted: {
        type: Boolean,
        default: false
    }
});

// Last Message Schema (embedded)
const lastMessageSchema = new mongoose.Schema({
    message: {
        type: String,
        default: null
    },
    sender_name: {
        type: String,
        default: null
    },
    sent_at: {
        type: Date,
        default: null
    },
    message_type: {
        type: String,
        default: 'text'
    }
});

// Main ChatRoom Schema
const chatRoomSchema = new mongoose.Schema({
    room_id: {
        type: String,
        required: true,
        unique: true
    },
    room_type: {
        type: String,
        enum: ['personal', 'support', 'group'],
        default: 'personal'
    },
    chat_type: {
        type: String,
        enum: ['personal', 'support', 'group'],
        default: 'personal'
    },
    is_support_chat: {
        type: Boolean,
        default: false
    },
    room_name: {
        type: String,
        default: null
    },
    room_avatar: {
        type: String,
        default: null
    },
    participants: [participantSchema],
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    last_message: {
        type: lastMessageSchema,
        default: () => ({})
    },
    status: {
        type: String,
        enum: ['active', 'archived', 'deleted'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Indexes for faster queries
// chatRoomSchema.index({ room_id: 1 });
chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ updatedAt: -1 });
chatRoomSchema.index({ status: 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);