// src/socket/chatSocket.js
const chatRoomRepository = require('../repositories/chatRoomRepository');
const chatMessageRepository = require('../repositories/chatMessageRepository');
const User = require('../models/User');
const { canAccessRoom, isSupportRoom } = require('../utils/chatHelpers');
const { userInboxRoom } = require('../utils/notificationEmitter');

// Online Users: userId -> { socketId, name, role, currentRoom }
const onlineUsers = new Map();
const typingUsers = new Map(); // roomId -> { userId, timeout }

class ChatSocket {
    constructor(io) {
        this.io = io;
        this.initializeEvents();
    }

    initializeEvents() {
        this.io.on('connection', (socket) => {
            if (!socket.user) {
                socket.disconnect();
                return;
            }

            if (process.env.NODE_ENV !== 'production') {
                console.log('✅ New authenticated client connected:', socket.id);
            }

            const user = socket.user;
            const userId = user._id.toString();
            const senderName = user.full_name || user.username || 'User';

            if (['admin', 'super_admin', 'staff', 'editor'].includes(user.role)) {
                socket.join('admin_notifications');
            }

            socket.join(userInboxRoom(userId));

            onlineUsers.set(userId, {
                socketId: socket.id,
                name: senderName,
                role: user.role,
                currentRoom: null,
                lastSeen: new Date()
            });

            this.io.emit('user_online', {
                user_id: userId,
                name: senderName,
                role: user.role,
                timestamp: new Date()
            });

            const onlineList = Array.from(onlineUsers.entries()).map(([id, data]) => ({
                user_id: id,
                name: data.name,
                role: data.role
            }));
            socket.emit('online_users_list', { users: onlineList });

            this.handleJoinRoom(socket, userId, senderName);
            this.handleLeaveRoom(socket, userId, senderName);
            this.handleSendMessage(socket, senderName);
            this.handleTyping(socket, userId, senderName);
            this.handleMarkSeen(socket, userId, senderName);
            this.handleDisconnect(socket, userId, senderName);

            socket.on('get_online_users', () => {
                const users = Array.from(onlineUsers.entries()).map(([id, data]) => ({
                    user_id: id,
                    name: data.name,
                    role: data.role
                }));
                socket.emit('online_users_list', { users });
            });
        });
    }

    async canUseRoom(roomId, user) {
        if (!roomId || !user) return { allowed: false, room: null };
        const room = await chatRoomRepository.findByRoomId(roomId);
        return { allowed: canAccessRoom(room, user), room };
    }
    
    // User joins a chat room
    handleJoinRoom(socket, userId, senderName) {
        socket.on('join_room', async (data) => {
            const { room_id, active } = data;
            if (!room_id) return;

            const { allowed } = await this.canUseRoom(room_id, socket.user);
            if (!allowed) {
                socket.emit('error', { message: 'Not authorized for this room' });
                return;
            }

            // Stay subscribed to all rooms for inbox realtime (do not leave previous rooms)
            socket.join(room_id);

            const userData = onlineUsers.get(userId) || {
                socketId: socket.id,
                name: senderName,
                role: socket.user?.role,
                currentRoom: null,
                lastSeen: new Date()
            };

            const nextData = { ...userData, socketId: socket.id };

            if (active !== false) {
                const prevActive = userData.currentRoom;
                nextData.currentRoom = room_id;

                if (prevActive && prevActive !== room_id) {
                    socket.to(prevActive).emit('user_left_room', {
                        user_id: userId,
                        name: senderName,
                        room_id: prevActive,
                        timestamp: new Date()
                    });
                }

                socket.to(room_id).emit('user_active_in_room', {
                    user_id: userId,
                    name: senderName,
                    room_id: room_id,
                    timestamp: new Date()
                });
            }

            onlineUsers.set(userId, nextData);

            console.log(`📢 ${senderName} joined room: ${room_id}${active === false ? ' (inbox)' : ''}`);
            socket.emit('room_joined', { room_id });
        });
    }
    
    // User leaves a chat room
    handleLeaveRoom(socket, userId, senderName) {
        socket.on('leave_room', (data) => {
            const { room_id } = data;
            
            socket.leave(room_id);
            
            const userData = onlineUsers.get(userId);
            if (userData) {
                onlineUsers.set(userId, {
                    ...userData,
                    currentRoom: null
                });
            }
            
            console.log(`📤 ${senderName} left room: ${room_id}`);
            
            // Notify others
            socket.to(room_id).emit('user_left_room', {
                user_id: userId,
                name: senderName,
                room_id: room_id,
                timestamp: new Date()
            });
        });
    }
    
    // Send message with auto-room creation
    handleSendMessage(socket, senderName) {
        socket.on('send_message', async (data) => {
            const { room_id, message, message_type, replyToId } = data;
            
            if (process.env.NODE_ENV !== 'production') {
                console.log(`📨 Message from ${senderName} in ${room_id}`);
            }
            
            if (!room_id || !message) {
                socket.emit('error', { message: 'room_id and message required' });
                return;
            }
            
            try {
                // Check if room exists, if not create it automatically
                let room = await chatRoomRepository.findByRoomId(room_id);
                
                if (room && isSupportRoom(room)) {
                    socket.emit('error', {
                        message: 'Support chats must use the support message API'
                    });
                    return;
                }

                if (room && !canAccessRoom(room, socket.user)) {
                    socket.emit('error', { message: 'Not authorized for this room' });
                    return;
                }
                
                if (!room) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.log(`🆕 Room ${room_id} doesn't exist, creating automatically...`);
                    }
                    
                    const userIds = room_id.split('_');
                    const objectIdPattern = /^[a-f\d]{24}$/i;
                    const otherUserId = userIds.find(id => id !== socket.user._id.toString());
                    
                    if (
                        userIds.length !== 2 ||
                        !userIds.includes(socket.user._id.toString()) ||
                        !otherUserId ||
                        !userIds.every((id) => objectIdPattern.test(id))
                    ) {
                        socket.emit('error', { message: 'Invalid room ID' });
                        return;
                    }
                    
                    const otherUser = await User.findById(otherUserId);
                    if (!otherUser) {
                        socket.emit('error', { message: 'User not found' });
                        return;
                    }
                    
                    room = await chatRoomRepository.create({
                        room_id: room_id,
                        room_type: 'personal',
                        chat_type: 'personal',
                        is_support_chat: false,
                        participants: [
                            { 
                                user_id: socket.user._id, 
                                name: senderName,
                                role: socket.user.role,
                                last_read_at: new Date(),
                                is_muted: false
                            },
                            { 
                                user_id: otherUser._id, 
                                name: otherUser.full_name || otherUser.username,
                                role: otherUser.role,
                                last_read_at: new Date(),
                                is_muted: false
                            }
                        ]
                    });
                    
                    if (process.env.NODE_ENV !== 'production') {
                        console.log(`✅ Auto-created room: ${room_id}`);
                    }
                    
                    const receiverInfo = onlineUsers.get(otherUserId);
                    if (receiverInfo) {
                        this.io.to(receiverInfo.socketId).emit('room_auto_created', {
                            success: true,
                            data: room,
                            message: `New message from ${senderName}`
                        });
                    }
                }
                
                // Handle reply to message
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
                
                // Create new message
                const newMessage = await chatMessageRepository.create({
                    room_id,
                    sender: {
                        user_id: socket.user._id,
                        name: senderName,
                        role: socket.user.role
                    },
                    message: message,
                    message_type: message_type || 'text',
                    reply_to: replyTo,
                    status: 'sent',
                    read_by: [{ user_id: socket.user._id, read_at: new Date() }]
                });
                
                // Update last message in room
                let lastMessageText = message;
                if (message_type === 'image') lastMessageText = '📸 Photo';
                if (message_type === 'file') lastMessageText = '📎 File';
                
                await chatRoomRepository.updateLastMessage(room_id, lastMessageText, senderName, message_type || 'text');
                
                const { emitChatEventToRoom } = require('../utils/chatEmit');
                emitChatEventToRoom(this.io, room, 'new_message', {
                    success: true,
                    data: newMessage
                });
                
            } catch (error) {
                console.error('❌ Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
    }
    
    // Mark messages as seen (when user views them)
    handleMarkSeen(socket, userId, senderName) {
        socket.on('mark_seen', async (data) => {
            const { room_id, message_ids } = data;
            
            if (!message_ids || message_ids.length === 0) return;
            
            try {
                const { allowed } = await this.canUseRoom(room_id, socket.user);
                if (!allowed) return;

                // Update each message's read_by array
                await chatMessageRepository.updateMany(
                    { 
                        room_id: room_id, 
                        _id: { $in: message_ids },
                        'read_by.user_id': { $ne: userId }
                    },
                    { 
                        $push: { read_by: { user_id: userId, read_at: new Date() } },
                        status: 'read'
                    }
                );
                
                await chatRoomRepository.updateLastRead(room_id, userId);
                
                // Emit seen status to ALL users in room (especially sender)
                this.io.to(room_id).emit('messages_seen', {
                    room_id,
                    seen_by: userId,
                    seen_by_name: senderName,
                    message_ids: message_ids,
                    seen_at: new Date()
                });
                
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`👁️ ${senderName} seen ${message_ids.length} messages in ${room_id}`);
                }
                
            } catch (error) {
                console.error('Mark seen error:', error);
            }
        });
    }
    
    // Typing indicator
    handleTyping(socket, userId, senderName) {
        socket.on('typing_start', async (data) => {
            const { room_id } = data;
            const { allowed } = await this.canUseRoom(room_id, socket.user);
            if (!allowed) return;
            
            const existing = typingUsers.get(room_id);
            if (existing && existing.userId === userId) {
                clearTimeout(existing.timeout);
            }
            
            const timeout = setTimeout(() => {
                socket.to(room_id).emit('typing_stop', {
                    room_id,
                    user_id: userId,
                    user_name: senderName
                });
                typingUsers.delete(room_id);
            }, 3000);
            
            typingUsers.set(room_id, { userId, timeout });
            socket.to(room_id).emit('typing_start', {
                room_id,
                user_id: userId,
                user_name: senderName
            });
        });
        
        socket.on('typing_stop', async (data) => {
            const { room_id } = data;
            const { allowed } = await this.canUseRoom(room_id, socket.user);
            if (!allowed) return;
            
            const existing = typingUsers.get(room_id);
            if (existing && existing.userId === userId) {
                clearTimeout(existing.timeout);
                typingUsers.delete(room_id);
            }
            
            socket.to(room_id).emit('typing_stop', {
                room_id,
                user_id: userId,
                user_name: senderName
            });
        });
    }
    
    // Disconnect
    handleDisconnect(socket, userId, senderName) {
        socket.on('disconnect', () => {
            if (userId) {
                onlineUsers.delete(userId);
                
                this.io.emit('user_offline', {
                    user_id: userId,
                    name: senderName,
                    last_seen: new Date(),
                    timestamp: new Date()
                });
                
                // Clear typing indicators
                for (const [roomId, data] of typingUsers.entries()) {
                    if (data.userId === userId) {
                        clearTimeout(data.timeout);
                        typingUsers.delete(roomId);
                        this.io.to(roomId).emit('typing_stop', {
                            room_id: roomId,
                            user_id: userId,
                            user_name: senderName
                        });
                    }
                }
                
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`❌ ${senderName} disconnected`);
                }
            }
        });
    }
}

module.exports = ChatSocket;
module.exports.getOnlineUsers = () => onlineUsers;