// src/socket/chatSocket.js
const chatRoomRepository = require('../repositories/chatRoomRepository');
const chatMessageRepository = require('../repositories/chatMessageRepository');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
            console.log('✅ New client connected:', socket.id);
            
            let token = socket.handshake.query.token;
            
            if (!token && socket.handshake.auth.token) {
                token = socket.handshake.auth.token;
            }
            
            if (!token && socket.handshake.headers.authorization) {
                const authHeader = socket.handshake.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    token = authHeader.split(' ')[1];
                }
            }
            
            if (!token) {
                console.log('❌ No token found, disconnecting');
                socket.disconnect();
                return;
            }
            
            jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
                if (err) {
                    console.error('❌ Token verification failed:', err.message);
                    socket.disconnect();
                    return;
                }
                
                try {
                    const user = await User.findById(decoded.id).select('-password');
                    
                    if (!user) {
                        console.log('❌ User not found');
                        socket.disconnect();
                        return;
                    }
                    
                    socket.user = user;
                    const userId = user._id.toString();
                    const senderName = user.full_name || user.username || 'User';
                    
                    // Check if user was already online
                    const wasAlreadyOnline = onlineUsers.has(userId);
                    console.log(`👤 ${senderName} (${userId}) - Online: ${!wasAlreadyOnline}`);
                    
                    // Store online user
                    onlineUsers.set(userId, {
                        socketId: socket.id,
                        name: senderName,
                        role: user.role,
                        currentRoom: null,
                        lastSeen: new Date()
                    });
                    
                    // Broadcast to ALL users that this user is online
                    this.io.emit('user_online', {
                        user_id: userId,
                        name: senderName,
                        role: user.role,
                        timestamp: new Date()
                    });
                    
                    // Send current online users list to this user
                    const onlineList = Array.from(onlineUsers.entries()).map(([id, data]) => ({
                        user_id: id,
                        name: data.name,
                        role: data.role
                    }));
                    socket.emit('online_users_list', { users: onlineList });
                    
                    // Handle events
                    this.handleJoinRoom(socket, userId, senderName);
                    this.handleLeaveRoom(socket, userId, senderName);
                    this.handleSendMessage(socket, senderName);
                    this.handleTyping(socket, userId, senderName);
                    this.handleMarkSeen(socket, userId, senderName);
                    this.handleDisconnect(socket, userId, senderName);
                    
                } catch (error) {
                    console.error('❌ Error:', error);
                    socket.disconnect();
                }
            });
        });
    }
    
    // ✅ User joins a chat room
    handleJoinRoom(socket, userId, senderName) {
        socket.on('join_room', (data) => {
            const { room_id } = data;
            
            // Leave previous room if exists
            const userData = onlineUsers.get(userId);
            if (userData && userData.currentRoom) {
                socket.leave(userData.currentRoom);
                console.log(`📤 ${senderName} left previous room: ${userData.currentRoom}`);
            }
            
            // Join new room
            socket.join(room_id);
            onlineUsers.set(userId, {
                ...userData,
                currentRoom: room_id
            });
            
            console.log(`📢 ${senderName} joined room: ${room_id}`);
            socket.emit('room_joined', { room_id });
            
            // Notify others in room that user is active in this room
            socket.to(room_id).emit('user_active_in_room', {
                user_id: userId,
                name: senderName,
                room_id: room_id,
                timestamp: new Date()
            });
        });
    }
    
    // ✅ User leaves a chat room
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
    
    // ✅ Send message with auto-room creation
    handleSendMessage(socket, senderName) {
        socket.on('send_message', async (data) => {
            const { room_id, message, message_type, replyToId, replyToMessage, replyToSender } = data;
            
            console.log(`📨 Message from ${senderName} in ${room_id}: ${message?.substring(0, 50)}`);
            
            if (!room_id || !message) {
                socket.emit('error', { message: 'room_id and message required' });
                return;
            }
            
            try {
                // ✅ Check if room exists, if not create it automatically
                let room = await chatRoomRepository.findByRoomId(room_id);
                
                if (!room) {
                    console.log(`🆕 Room ${room_id} doesn't exist, creating automatically...`);
                    
                    // Parse roomId to get participants (format: userId1_userId2)
                    const userIds = room_id.split('_');
                    const otherUserId = userIds.find(id => id !== socket.user._id.toString());
                    
                    if (!otherUserId) {
                        socket.emit('error', { message: 'Invalid room ID' });
                        return;
                    }
                    
                    const otherUser = await User.findById(otherUserId);
                    if (!otherUser) {
                        socket.emit('error', { message: 'User not found' });
                        return;
                    }
                    
                    // Create new room automatically
                    room = await chatRoomRepository.create({
                        room_id: room_id,
                        room_type: 'personal',
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
                                name: otherUser.full_name || otherUser.username || 'User',
                                role: otherUser.role,
                                last_read_at: new Date(),
                                is_muted: false
                            }
                        ]
                    });
                    
                    console.log(`✅ Auto-created room: ${room_id}`);
                    
                    // Notify receiver that a new room was created
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
                if (replyToId && replyToMessage) {
                    replyTo = {
                        message_id: replyToId,
                        message: replyToMessage.substring(0, 100),
                        sender_name: replyToSender || 'User',
                        sender_id: socket.user._id
                    };
                } else if (replyToId) {
                    // Fetch original message from database
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
                
                // Emit to room (broadcast to all including sender)
                this.io.to(room_id).emit('new_message', {
                    success: true,
                    data: newMessage
                });
                
                // Send delivery receipt to sender
                socket.emit('message_delivered', {
                    message_id: newMessage._id,
                    room_id: room_id,
                    status: 'delivered'
                });
                
            } catch (error) {
                console.error('❌ Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
    }
    
    // ✅ Mark messages as seen (when user views them)
    handleMarkSeen(socket, userId, senderName) {
        socket.on('mark_seen', async (data) => {
            const { room_id, message_ids } = data;
            
            if (!message_ids || message_ids.length === 0) return;
            
            try {
                await chatMessageRepository.markAsRead(room_id, userId, message_ids);
                await chatRoomRepository.updateLastRead(room_id, userId);
                
                // Emit seen status to ALL users in room (especially sender)
                this.io.to(room_id).emit('messages_seen', {
                    room_id,
                    user_id: userId,
                    user_name: senderName,
                    message_ids: message_ids,
                    seen_at: new Date()
                });
                
                // Also send individual message read events
                for (const messageId of message_ids) {
                    this.io.to(room_id).emit('message_read', {
                        message_id: messageId,
                        user_id: userId,
                        user_name: senderName,
                        read_at: new Date()
                    });
                }
                
                console.log(`👁️ ${senderName} seen ${message_ids.length} messages in ${room_id}`);
                
            } catch (error) {
                console.error('Mark seen error:', error);
            }
        });
    }
    
    // ✅ Typing indicator
    handleTyping(socket, userId, senderName) {
        socket.on('typing_start', (data) => {
            const { room_id } = data;
            
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
        
        socket.on('typing_stop', (data) => {
            const { room_id } = data;
            
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
    
    // ✅ Disconnect
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
                
                console.log(`❌ ${senderName} disconnected`);
            }
        });
    }
}

module.exports = ChatSocket;
module.exports.getOnlineUsers = () => onlineUsers;