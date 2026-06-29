// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
    },
    full_name: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'staff', 'viewer'],
        default: 'viewer'
    },
    permissions: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    department: {
        type: String,
        default: null
    },
    position: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    avatar: {
        type: String,
        default: null
    },
    last_login: {
        type: Date,
        default: null
    },
    email_verified: {
        type: Boolean,
        default: false
    },
    email_verification_otp: {
        type: String,
        default: null
    },
    email_verification_otp_expires_at: {
        type: Date,
        default: null
    },
    reset_password_otp: {
        type: String,
        default: null
    },
    reset_password_otp_expires_at: {
        type: Date,
        default: null
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user has permission
userSchema.methods.hasPermission = function(permission) {
    if (this.role === 'super_admin') return true;
    if (this.role === 'admin') return true;
    return this.permissions?.includes(permission) || false;
};

// Get user's chat permissions (Updated with Support Chat permissions)
userSchema.methods.getChatPermissions = function() {
    const basePermissions = {
        // Basic permissions
        canSendMessages: true,
        canEditOwnMessages: true,
        canDeleteOwnMessages: true,
        
        // Group permissions
        canCreateGroups: false,
        canAddParticipants: false,
        canRemoveParticipants: false,
        
        // Admin permissions
        canDeleteAnyMessage: false,
        canMuteUsers: false,
        canViewAllChats: false,
        
        // Support Chat permissions
        canViewAllSupportChats: false,      // Staff can see all support chats
        canReplyToSupport: false,           // Staff can reply to support chats
        canCreateSupportChats: true,        // Users can start support chats
        canViewStaffOnlyMessages: false     // Only staff can see staff-only messages
    };
    
    // Super Admin - Full access to everything
    if (this.role === 'super_admin') {
        return {
            canSendMessages: true,
            canEditOwnMessages: true,
            canDeleteOwnMessages: true,
            canCreateGroups: true,
            canAddParticipants: true,
            canRemoveParticipants: true,
            canDeleteAnyMessage: true,
            canMuteUsers: true,
            canViewAllChats: true,
            canViewAllSupportChats: true,
            canReplyToSupport: true,
            canCreateSupportChats: true,
            canViewStaffOnlyMessages: true
        };
    }
    
    // Admin - Full access except super admin specific
    if (this.role === 'admin') {
        return {
            canSendMessages: true,
            canEditOwnMessages: true,
            canDeleteOwnMessages: true,
            canCreateGroups: true,
            canAddParticipants: true,
            canRemoveParticipants: true,
            canDeleteAnyMessage: true,
            canMuteUsers: true,
            canViewAllChats: true,
            canViewAllSupportChats: true,
            canReplyToSupport: true,
            canCreateSupportChats: true,
            canViewStaffOnlyMessages: true
        };
    }
    
    // Staff - Can see and reply to support chats, but limited group permissions
    if (this.role === 'staff') {
        return {
            canSendMessages: true,
            canEditOwnMessages: true,
            canDeleteOwnMessages: true,
            canCreateGroups: false,
            canAddParticipants: false,
            canRemoveParticipants: false,
            canDeleteAnyMessage: false,
            canMuteUsers: false,
            canViewAllChats: false,
            canViewAllSupportChats: true,      // Staff can see all support chats
            canReplyToSupport: true,            // Staff can reply to users
            canCreateSupportChats: true,        // Staff can create support chats for users
            canViewStaffOnlyMessages: true      // Staff can see staff-only messages
        };
    }
    
    // Viewer/Regular User - Can only access their own chats
    return {
        canSendMessages: true,
        canEditOwnMessages: true,
        canDeleteOwnMessages: true,
        canCreateGroups: false,
        canAddParticipants: false,
        canRemoveParticipants: false,
        canDeleteAnyMessage: false,
        canMuteUsers: false,
        canViewAllChats: false,
        canViewAllSupportChats: false,     // Users can only see their own support chats
        canReplyToSupport: false,          // Users cannot reply (only start new chats)
        canCreateSupportChats: true,       // Users can start support chats
        canViewStaffOnlyMessages: false    // Users cannot see staff-only messages
    };
};

// Helper method to check if user is staff (admin, staff, super_admin)
userSchema.methods.isStaff = function() {
    return ['super_admin', 'admin', 'staff'].includes(this.role);
};

// Helper method to check if user is admin
userSchema.methods.isAdmin = function() {
    return ['super_admin', 'admin'].includes(this.role);
};

// Helper method to get user's display name
userSchema.methods.getDisplayName = function() {
    return this.full_name || this.username || this.email;
};

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);