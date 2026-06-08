// src/middleware/chatPermissions.js

const checkChatPermission = (permission) => {
    return (req, res, next) => {
        const permissions = req.user.getChatPermissions();
        
        if (!permissions[permission]) {
            return res.status(403).json({
                success: false,
                message: `You don't have permission to ${permission.replace('can', '').toLowerCase()}`
            });
        }
        
        next();
    };
};

const canAccessRoom = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const ChatRoom = require('../models/ChatRoom');
        
        const room = await ChatRoom.findOne({ room_id: roomId });
        
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        
        const isParticipant = room.participants.some(
            p => p.user_id.toString() === req.user._id.toString()
        );
        
        const permissions = req.user.getChatPermissions();
        const isStaff = ['admin', 'staff', 'super_admin'].includes(req.user.role);
        
        // ✅ Support Chat: Staff can access any support room, users can only access their own
        if (room.chat_type === 'support') {
            if (isStaff) {
                // Staff can access any support chat
                req.room = room;
                return next();
            } else if (isParticipant) {
                // User can only access their own support chats
                req.room = room;
                return next();
            }
            return res.status(403).json({ 
                success: false, 
                message: 'You don\'t have access to this support conversation' 
            });
        }
        
        // Personal/Group Chat: Admin can access any room
        if (permissions.canViewAllChats || isParticipant) {
            req.room = room;
            return next();
        }
        
        return res.status(403).json({ 
            success: false, 
            message: 'You don\'t have access to this conversation' 
        });
    } catch (error) {
        next(error);
    }
};

// ✅ NEW: Check if user can view message (for support chat filtering)
const canViewMessage = (message, user) => {
    const isStaff = ['admin', 'staff', 'super_admin'].includes(user.role);
    const isSender = message.sender?.user_id?.toString() === user._id?.toString();
    
    // Staff can see all messages in support chats
    if (isStaff) return true;
    
    // For regular users:
    // - Can see their own messages
    // - Can see staff replies
    // - Cannot see staff-only messages
    if (message.visible_to_staff_only) return false;
    if (isSender) return true;
    if (message.is_staff_reply) return true;
    if (message.is_public) return true;
    
    return false;
};

// ✅ NEW: Filter messages based on user role (for getMessages)
const filterMessagesByRole = (messages, user) => {
    const isStaff = ['admin', 'staff', 'super_admin'].includes(user.role);
    
    if (isStaff) return messages;
    
    // Filter for regular users
    return messages.filter(msg => {
        // Staff-only messages are hidden
        if (msg.visible_to_staff_only) return false;
        // User can see their own messages
        if (msg.sender?.user_id?.toString() === user._id?.toString()) return true;
        // User can see staff replies
        if (msg.is_staff_reply) return true;
        // User can see public messages
        if (msg.is_public) return true;
        return false;
    });
};

// ✅ NEW: Check support room access for staff list view
const canViewSupportRooms = (req, res, next) => {
    const isStaff = ['admin', 'staff', 'super_admin'].includes(req.user.role);
    
    if (!isStaff) {
        return res.status(403).json({
            success: false,
            message: 'Only staff members can view all support conversations'
        });
    }
    
    next();
};

module.exports = { 
    checkChatPermission, 
    canAccessRoom,
    canViewMessage,           // ✅ New
    filterMessagesByRole,    // ✅ New
    canViewSupportRooms      // ✅ New
};