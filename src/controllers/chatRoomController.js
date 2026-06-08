// src/controllers/chatRoomController.js
const chatRoomRepository = require('../repositories/chatRoomRepository');
const userRepository = require('../repositories/userRepository');
const ChatMessage = require('../models/ChatMessage');
const ChatRoom = require('../models/ChatRoom'); // ✅ ADD THIS
const User = require('../models/User'); // ✅ ADD THIS

console.log('✅ chatRoomController loaded');

const getMyChatRooms = async (req, res, next) => {
    try {
        const rooms = await chatRoomRepository.findByUserId(req.user._id);
        
        const roomsWithUnread = await Promise.all(rooms.map(async (room) => {
            const participant = room.participants.find(
                p => p.user_id.toString() === req.user._id.toString()
            );
            const lastReadAt = participant?.last_read_at || new Date(0);
            
            const unreadCount = await ChatMessage.countDocuments({
                room_id: room.room_id,
                createdAt: { $gt: lastReadAt },
                'sender.user_id': { $ne: req.user._id },
                is_deleted: false,
                'read_by.user_id': { $ne: req.user._id }
            });
            
            const isMuted = participant?.is_muted || false;
            
            return {
                ...room.toObject(),
                unread_count: unreadCount,
                is_muted: isMuted
            };
        }));
        
        res.json({ success: true, count: roomsWithUnread.length, data: roomsWithUnread });
    } catch (error) { 
        console.error('Get rooms error:', error);
        next(error); 
    }
};

const createPersonalChatRoom = async (req, res, next) => {
    try {
        const { targetUserId } = req.body;
        
        if (!targetUserId) {
            return res.status(400).json({ success: false, message: 'targetUserId is required' });
        }
        
        const targetUser = await userRepository.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userIds = [req.user._id.toString(), targetUserId].sort();
        const roomId = userIds.join('_');

        let room = await chatRoomRepository.findByRoomId(roomId);
        if (!room) {
            room = await chatRoomRepository.create({
                room_id: roomId,
                room_type: 'personal',
                participants: [
                    { 
                        user_id: req.user._id, 
                        name: req.user.full_name || req.user.username || 'User',
                        role: req.user.role,
                        last_read_at: new Date(),
                        is_muted: false
                    },
                    { 
                        user_id: targetUser._id, 
                        name: targetUser.full_name || targetUser.username || 'User',
                        role: targetUser.role,
                        last_read_at: new Date(),
                        is_muted: false
                    }
                ]
            });
        }
        
        res.status(201).json({ success: true, data: room });
    } catch (error) { 
        console.error('Create room error:', error);
        next(error); 
    }
};

const muteRoom = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const { muted } = req.body;

        const room = await chatRoomRepository.findByRoomId(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const isParticipant = room.participants.some(
            p => p.user_id.toString() === req.user._id.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Not a participant' });
        }

        await chatRoomRepository.updateOne(
            { room_id: roomId, 'participants.user_id': req.user._id },
            { $set: { 'participants.$.is_muted': muted } }
        );

        res.json({ 
            success: true, 
            message: muted ? 'Room muted successfully' : 'Room unmuted successfully' 
        });
    } catch (error) {
        console.error('Mute room error:', error);
        next(error);
    }
};

const deleteRoom = async (req, res, next) => {
    try {
        const { roomId } = req.params;

        const room = await chatRoomRepository.findByRoomId(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const isParticipant = room.participants.some(
            p => p.user_id.toString() === req.user._id.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Not a participant' });
        }

        await chatRoomRepository.updateOne(
            { room_id: roomId },
            { status: 'deleted', $push: { deleted_by: req.user._id } }
        );

        res.json({ success: true, message: 'Conversation deleted successfully' });
    } catch (error) {
        console.error('Delete room error:', error);
        next(error);
    }
};

const clearChatHistory = async (req, res, next) => {
    try {
        const { roomId } = req.params;

        const room = await chatRoomRepository.findByRoomId(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const isParticipant = room.participants.some(
            p => p.user_id.toString() === req.user._id.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Not a participant' });
        }

        const result = await ChatMessage.updateMany(
            { room_id: roomId },
            { $addToSet: { deleted_by: req.user._id } }
        );

        res.json({ 
            success: true, 
            message: 'Chat history cleared successfully',
            deletedCount: result.modifiedCount 
        });
    } catch (error) {
        console.error('Clear history error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== SUPPORT CHAT FUNCTIONS ====================

/**
 * @desc    Create or get support chat for user
 * @route   POST /api/chat/rooms/support/create
 * @access  Private (User or Staff)
 */
const getOrCreateSupportChat = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const targetUserId = userId || req.user._id;
        
        // Find existing support chat
        let room = await ChatRoom.findOne({
            chat_type: 'support',
            'participants.user_id': targetUserId,
            status: 'active'
        });
        
        if (!room) {
            // Get all staff users
            const staffUsers = await User.find({ 
                role: { $in: ['admin', 'staff', 'super_admin'] },
                status: 'active'
            });
            
            // Get target user info
            const targetUser = await User.findById(targetUserId);
            
            if (!targetUser) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            
            const participants = [
                { 
                    user_id: targetUserId, 
                    name: targetUser.full_name || targetUser.username || 'User',
                    role: targetUser.role || 'viewer',
                    last_read_at: new Date(),
                    is_muted: false
                },
                ...staffUsers.map(staff => ({
                    user_id: staff._id,
                    name: staff.full_name || staff.username,
                    role: staff.role,
                    last_read_at: new Date(),
                    is_muted: false
                }))
            ];
            
            room = await ChatRoom.create({
                room_id: `support_${targetUserId}_${Date.now()}`,
                room_type: 'support',
                chat_type: 'support',
                is_support_chat: true,
                room_name: `Support: ${targetUser.full_name || targetUser.username || 'User'}`,
                participants: participants,
                admins: staffUsers.map(s => s._id),
                status: 'active'
            });
        }
        
        res.json({ success: true, data: room });
    } catch (error) {
        console.error('Create support chat error:', error);
        next(error);
    }
};

/**
 * @desc    Get all support chats for staff
 * @route   GET /api/chat/rooms/support/all
 * @access  Private (Admin/Staff only)
 */
const getSupportChatsForStaff = async (req, res, next) => {
    try {
        // Check if user is staff
        const isStaff = ['admin', 'staff', 'super_admin'].includes(req.user.role);
        if (!isStaff) {
            return res.status(403).json({ success: false, message: 'Access denied. Staff only.' });
        }
        
        const rooms = await ChatRoom.find({
            chat_type: 'support',
            status: 'active'
        }).sort({ updatedAt: -1 });
        
        const roomsWithInfo = await Promise.all(rooms.map(async (room) => {
            const participant = room.participants.find(
                p => p.user_id.toString() === req.user._id.toString()
            );
            const lastReadAt = participant?.last_read_at || new Date(0);
            
            const unreadCount = await ChatMessage.countDocuments({
                room_id: room.room_id,
                createdAt: { $gt: lastReadAt },
                'sender.user_id': { $ne: req.user._id },
                is_deleted: false,
                'read_by.user_id': { $ne: req.user._id }
            });
            
            // Get user info (the one who opened the ticket)
            const userParticipant = room.participants.find(
                p => p.role === 'viewer' || p.role === 'user'
            );
            
            return {
                ...room.toObject(),
                unread_count: unreadCount,
                user_name: userParticipant?.name || 'User',
                user_id: userParticipant?.user_id
            };
        }));
        
        res.json({ success: true, data: roomsWithInfo });
    } catch (error) {
        console.error('Get support chats error:', error);
        next(error);
    }
};

/**
 * @desc    Get user's own support chats
 * @route   GET /api/chat/rooms/support/my
 * @access  Private
 */
const getMySupportChats = async (req, res, next) => {
    try {
        const rooms = await ChatRoom.find({
            chat_type: 'support',
            'participants.user_id': req.user._id,
            status: 'active'
        }).sort({ updatedAt: -1 });
        
        const roomsWithInfo = await Promise.all(rooms.map(async (room) => {
            const participant = room.participants.find(
                p => p.user_id.toString() === req.user._id.toString()
            );
            const lastReadAt = participant?.last_read_at || new Date(0);
            
            const unreadCount = await ChatMessage.countDocuments({
                room_id: room.room_id,
                createdAt: { $gt: lastReadAt },
                'sender.user_id': { $ne: req.user._id },
                is_deleted: false,
                'read_by.user_id': { $ne: req.user._id }
            });
            
            return {
                ...room.toObject(),
                unread_count: unreadCount
            };
        }));
        
        res.json({ success: true, data: roomsWithInfo });
    } catch (error) {
        console.error('Get my support chats error:', error);
        next(error);
    }
};

module.exports = { 
    getMyChatRooms, 
    createPersonalChatRoom,
    muteRoom,
    deleteRoom,
    clearChatHistory,
    getOrCreateSupportChat,
    getSupportChatsForStaff,
    getMySupportChats
};