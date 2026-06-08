    // src/models/ChatMessage.js
    const mongoose = require('mongoose');

    // Read By Schema (embedded)
    const readBySchema = new mongoose.Schema({
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        read_at: {
            type: Date,
            default: Date.now
        }
    });

    // Reply To Schema (embedded)
    const replyToSchema = new mongoose.Schema({
        message_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChatMessage'
        },
        message: {
            type: String,
            default: null
        },
        sender_name: {
            type: String,
            default: null
        },
        sender_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    });

    // File Info Schema (embedded)
    const fileInfoSchema = new mongoose.Schema({
        name: { type: String, default: null },
        size: { type: String, default: null },
        type: { type: String, default: null },
        mimeType: { type: String, default: null }
    });

    // Attachment Schema (embedded)
    const attachmentSchema = new mongoose.Schema({
        file_name: {
            type: String,
            required: true
        },
        file_url: {
            type: String,
            required: true
        },
        file_type: {
            type: String,
            required: true
        },
        file_size: {
            type: Number,
            required: true
        },
        public_id: {
            type: String,
            default: null
        }
    });

    // Sender/Receiver Schema (embedded)
    const senderReceiverSchema = new mongoose.Schema({
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
        }
    });

    // Main ChatMessage Schema
    const chatMessageSchema = new mongoose.Schema({
        room_id: {
            type: String,
            required: true,
            index: true
        },
        sender: {
            type: senderReceiverSchema,
            required: true
        },
        receiver: {
            type: senderReceiverSchema,
            default: null
        },
        message: {
            type: String,
            default: null
        },
        message_type: {
            type: String,
            enum: ['text', 'image', 'file', 'audio', 'video'],
            default: 'text'
        },
        attachments: [attachmentSchema],
        reply_to: {
            type: replyToSchema,
            default: null
        },
        fileInfo: {
            type: fileInfoSchema,
            default: null
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'read', 'deleted'],
            default: 'sent'
        },
        read_by: [readBySchema],
        deleted_by: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        is_deleted: {
            type: Boolean,
            default: false
        },
        edited: {
            type: Boolean,
            default: false
        },
        edited_at: {
            type: Date,
            default: null
        },
        is_public: {
    type: Boolean,
    default: false
},
is_staff_reply: {
    type: Boolean,
    default: false
},
visible_to_staff_only: {
    type: Boolean,
    default: false
}
    }, {
        timestamps: true
    });

    // Indexes for faster queries
    chatMessageSchema.index({ room_id: 1, createdAt: -1 });
    chatMessageSchema.index({ sender: 1, createdAt: -1 });
    chatMessageSchema.index({ status: 1 });
    chatMessageSchema.index({ room_id: 1, 'read_by.user_id': 1 });

    module.exports = mongoose.model('ChatMessage', chatMessageSchema);