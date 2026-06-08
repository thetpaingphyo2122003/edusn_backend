// src/controllers/chatMessageController.js
const chatMessageRepository = require('../repositories/chatMessageRepository');
const chatRoomRepository = require('../repositories/chatRoomRepository');
const { checkChatPermission } = require('../middleware/chatPermissions');
console.log('✅ chatMessageController loaded');

/**
 * @desc    Get messages for a room
 * @route   GET /api/chat/messages/:roomId
 * @access  Private
 */
const getMessages = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const isStaff = ['admin', 'staff', 'super_admin'].includes(req.user.role);
        
        const room = await chatRoomRepository.findByRoomId(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        
        let filter = { room_id: roomId, is_deleted: false };
        
        // Role-based filtering for support chats
        if (room.chat_type === 'support') {
            if (!isStaff) {
                // Regular users can only see:
                // 1. Their own messages
                // 2. Staff replies (is_staff_reply = true)
                // 3. Public messages
                filter = {
                    ...filter,
                    $or: [
                        { 'sender.user_id': req.user._id },
                        { is_staff_reply: true },
                        { is_public: true }
                    ],
                    visible_to_staff_only: { $ne: true }
                };
            }
            // Staff can see all messages in support chats
        }
        
        const before = req.query.before ? new Date(req.query.before) : null;
        const limit = parseInt(req.query.limit) || 50;
        
        if (before) filter.createdAt = { $lt: before };
        
        const messages = await chatMessageRepository.findAll(
            filter,
            { sort: { createdAt: 1 }, limit }
        );
        
        // Remove duplicates
        const uniqueMessages = [];
        const seenIds = new Set();
        
        for (const msg of messages) {
            const id = msg._id.toString();
            if (!seenIds.has(id)) {
                seenIds.add(id);
                uniqueMessages.push(msg);
            }
        }
        
        // Mark as read
        const unreadMessages = uniqueMessages.filter(
            (msg) =>
                msg.sender.user_id.toString() !== req.user._id.toString() &&
                !msg.read_by?.some(
                    (r) => r.user_id.toString() === req.user._id.toString()
                )
        );
        
        if (unreadMessages.length > 0) {
            const readTime = new Date();
            
            for (const msg of unreadMessages) {
                await chatMessageRepository.updateById(msg._id, {
                    $push: {
                        read_by: {
                            user_id: req.user._id,
                            read_at: readTime
                        }
                    },
                    status: 'read'
                });
            }
            
            await chatRoomRepository.updateLastRead(roomId, req.user._id);
            
            const io = req.app.get('io');
            if (io) {
                io.to(roomId).emit('messages_seen', {
                    room_id: roomId,
                    message_ids: unreadMessages.map((m) => m._id.toString()),
                    seen_by: req.user._id,
                    seen_at: readTime
                });
            }
        }
        
        res.json({
            success: true,
            count: uniqueMessages.length,
            data: uniqueMessages
        });
    } catch (error) {
        console.error('Get messages error:', error);
        next(error);
    }
};

/**
 * @desc    Send a message with duplicate prevention
 * @route   POST /api/chat/messages
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
    try {
        const { roomId, message, message_type, replyToId, fileInfo, tempId } = req.body;

        if (!roomId) {
            return res.status(400).json({ success: false, message: 'roomId is required' });
        }

        if (!message && message_type !== 'file' && message_type !== 'image') {
            return res.status(400).json({ success: false, message: 'Message content is required' });
        }

        const room = await chatRoomRepository.findByRoomId(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Chat room not found' });
        }

        // Check for duplicate submission in last 5 seconds
        const recentMessage = await chatMessageRepository.findOne({
            room_id: roomId,
            'sender.user_id': req.user._id,
            message: message_type === 'text' ? message : undefined,
            created_at: { $gt: new Date(Date.now() - 5000) }
        });

        if (recentMessage && message_type === 'text') {
            return res.status(200).json({ 
                success: true, 
                message: 'Message already sent',
                data: recentMessage,
                isDuplicate: true
            });
        }

        const senderName = req.user.full_name || req.user.username || 'User';

        let receiver = null;
        let replyTo = null;

        if (room.room_type === 'personal') {
            const receiverParticipant = room.participants.find(
                p => p.user_id.toString() !== req.user._id.toString()
            );
            if (receiverParticipant) {
                receiver = {
                    user_id: receiverParticipant.user_id,
                    name: receiverParticipant.name,
                    avatar: receiverParticipant.avatar,
                    role: receiverParticipant.role
                };
            }
        }

        // Handle reply to message
        if (replyToId) {
            const originalMessage = await chatMessageRepository.findById(replyToId);
            if (originalMessage && !originalMessage.is_deleted) {
                replyTo = {
                    message_id: originalMessage._id,
                    message: originalMessage.message.substring(0, 100),
                    sender_name: originalMessage.sender.name,
                    sender_id: originalMessage.sender.user_id
                };
            }
        }

        // Prepare fileInfo if provided
        let processedFileInfo = null;
        if (fileInfo) {
            processedFileInfo = {
                name: fileInfo.name,
                size: fileInfo.size,
                type: fileInfo.type,
                mimeType: fileInfo.mimeType
            };
        }

        // Create message
        const newMessage = await chatMessageRepository.create({
            room_id: roomId,
            sender: { 
                user_id: req.user._id, 
                name: senderName,
                role: req.user.role 
            },
            receiver: receiver,
            message: message,
            message_type: message_type || 'text',
            reply_to: replyTo,
            fileInfo: processedFileInfo,
            status: 'sent',
            read_by: [{ user_id: req.user._id, read_at: new Date() }],
            created_at: new Date(),
            updated_at: new Date()
        });

        // Update last message in room
        let lastMessageText = message;
        if (message_type === 'file') lastMessageText = '📎 File attached';
        if (message_type === 'image') lastMessageText = '🖼️ Image sent';
        
        await chatRoomRepository.updateLastMessage(
            roomId, 
            lastMessageText,
            senderName, 
            message_type || 'text'
        );

        // Emit via socket
        const io = req.app.get('io');
        if (io) {
            io.to(roomId).emit('new_message', {
                success: true,
                data: newMessage,
                tempId: tempId
            });
        }

        res.status(201).json({ 
            success: true, 
            message: 'Message sent successfully',
            data: newMessage,
            tempId: tempId
        });
    } catch (error) { 
        console.error('Send message error:', error);
        next(error); 
    }
};

/**
 * @desc    Edit a message
 * @route   PUT /api/chat/messages/:messageId
 * @access  Private
 */
const editMessage = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message content is required' });
        }

        const existingMessage = await chatMessageRepository.findById(messageId);
        if (!existingMessage) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        if (existingMessage.sender.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
        }

        const updatedMessage = await chatMessageRepository.updateById(messageId, { 
            message: message,
            edited: true,
            edited_at: new Date()
        });

        // Emit via socket
        const io = req.app.get('io');
        if (io) {
            io.to(existingMessage.room_id).emit('message_edited', {
                success: true,
                data: updatedMessage
            });
        }

        res.json({ success: true, message: 'Message edited successfully', data: updatedMessage });
    } catch (error) {
        console.error('Edit message error:', error);
        next(error);
    }
};

/**
 * @desc    Delete a message (soft delete)
 * @route   DELETE /api/chat/messages/:messageId
 * @access  Private
 */
const deleteMessage = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const permissions = req.user.getChatPermissions();

        const message = await chatMessageRepository.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        const isOwn = message.sender.user_id.toString() === req.user._id.toString();
        
        if (!isOwn && !permissions.canDeleteAnyMessage) {
            return res.status(403).json({ 
                success: false, 
                message: 'You can only delete your own messages' 
            });
        }

        await chatMessageRepository.updateById(messageId, { 
            is_deleted: true,
            deleted_at: new Date(),
            status: 'deleted',
            deleted_by: req.user._id
        });

        const io = req.app.get('io');
        if (io) {
            io.to(message.room_id).emit('message_deleted', {
                success: true,
                messageId: messageId,
                roomId: message.room_id,
                deletedBy: req.user._id,
                deletedByName: req.user.full_name || req.user.username
            });
        }

        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        next(error);
    }
};

/**
 * @desc    Delete message for me only (hide for current user)
 * @route   PUT /api/chat/messages/:messageId/delete-for-me
 * @access  Private
 */
const deleteMessageForMe = async (req, res, next) => {
    try {
        const { messageId } = req.params;

        const message = await chatMessageRepository.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        await chatMessageRepository.updateById(messageId, {
            $push: { deleted_by: req.user._id }
        });

        res.json({ success: true, message: 'Message hidden for you' });
    } catch (error) {
        console.error('Delete for me error:', error);
        next(error);
    }
};

/**
 * @desc    Mark all messages as read in a room
 * @route   PUT /api/chat/messages/read-all/:roomId
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
    try {
        const { roomId } = req.params;

        const room = await chatRoomRepository.findByRoomId(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // Update all unread messages
        await chatMessageRepository.updateMany(
            { 
                room_id: roomId, 
                'sender.user_id': { $ne: req.user._id },
                'read_by.user_id': { $ne: req.user._id },
                is_deleted: false 
            },
            { 
                $push: { read_by: { user_id: req.user._id, read_at: new Date() } },
                status: 'read'
            }
        );

        // Update last read in room
        await chatRoomRepository.updateLastRead(roomId, req.user._id);

        // Emit via socket
        const io = req.app.get('io');
        if (io) {
            io.to(roomId).emit('messages_read', {
                success: true,
                roomId: roomId,
                userId: req.user._id
            });
        }

        res.json({ success: true, message: 'All messages marked as read' });
    } catch (error) {
        console.error('Mark all as read error:', error);
        next(error);
    }
};

/**
 * @desc    Send support message (with special flags)
 * @route   POST /api/chat/messages/support
 * @access  Private
 */
const sendSupportMessage = async (req, res, next) => {
    try {
        const { roomId, message, message_type, replyToId, isStaffOnly } = req.body;
        const isStaff = ['admin', 'staff', 'super_admin'].includes(req.user.role);
        
        if (!roomId || !message) {
            return res.status(400).json({ success: false, message: 'roomId and message are required' });
        }
        
        const room = await chatRoomRepository.findByRoomId(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Chat room not found' });
        }
        
        // Check if user is participant
        const isParticipant = room.participants.some(
            p => p.user_id.toString() === req.user._id.toString()
        );
        
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'You are not a participant in this chat' });
        }
        
        const senderName = req.user.full_name || req.user.username || 'User';
        
        let replyTo = null;
        if (replyToId) {
            const originalMessage = await chatMessageRepository.findById(replyToId);
            if (originalMessage && !originalMessage.is_deleted) {
                replyTo = {
                    message_id: originalMessage._id,
                    message: originalMessage.message?.substring(0, 100),
                    sender_name: originalMessage.sender?.name,
                    sender_id: originalMessage.sender?.user_id
                };
            }
        }
        
        const newMessage = await chatMessageRepository.create({
            room_id: roomId,
            sender: { user_id: req.user._id, name: senderName, role: req.user.role },
            message: message,
            message_type: message_type || 'text',
            reply_to: replyTo,
            is_public: !isStaff,
            is_staff_reply: isStaff,
            visible_to_staff_only: isStaffOnly || false,
            status: 'sent',
            read_by: [{ user_id: req.user._id, read_at: new Date() }]
        });
        
        let lastMessageText = message;
        if (message_type === 'file') lastMessageText = '📎 File attached';
        if (message_type === 'image') lastMessageText = '🖼️ Image sent';
        
        await chatRoomRepository.updateLastMessage(roomId, lastMessageText, senderName, message_type || 'text');
        
        const io = req.app.get('io');
        if (io) {
            io.to(roomId).emit('new_message', {
                success: true,
                data: newMessage,
                is_staff: isStaff
            });
        }
        
        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        console.error('Send support message error:', error);
        next(error);
    }
};

// Export all functions (ONLY ONCE at the end)
module.exports = { 
    getMessages, 
    sendMessage,
    editMessage,
    deleteMessage,
    deleteMessageForMe, 
    markAllAsRead,
    sendSupportMessage     
};