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
            
            // ✅ Notify others in room that user is active in this room
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
    
// src/socket/chatSocket.js - handleSendMessage function ထဲမှာ

handleSendMessage(socket, senderName) {
    socket.on('send_message', async (data) => {
        const { room_id, message, message_type, replyToId, replyToMessage, replyToSender } = data;
        
        try {
            // ✅ Check if room exists
            let room = await chatRoomRepository.findByRoomId(room_id);
            
            if (!room) {
                // Auto-create room
                const userIds = room_id.split('_');
                const otherUserId = userIds.find(id => id !== socket.user._id.toString());
                const otherUser = await User.findById(otherUserId);
                
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
                            name: otherUser.full_name || otherUser.username,
                            role: otherUser.role,
                            last_read_at: new Date(),
                            is_muted: false
                        }
                    ]
                });
                
                // ✅ Notify receiver that a new room was created
                const receiverSocket = onlineUsers.get(otherUserId);
                if (receiverSocket) {
                    this.io.to(receiverSocket.socketId).emit('room_auto_created', {
                        success: true,
                        data: room,
                        message: `New message from ${senderName}`
                    });
                }
            }
            
            // Continue with message creation...
            // (rest of your existing code)
            
        } catch (error) {
            console.error('Send message error:', error);
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
                
                // ✅ Emit seen status to ALL users in room (especially sender)
                this.io.to(room_id).emit('messages_seen', {
                    room_id,
                    user_id: userId,
                    user_name: senderName,
                    message_ids: message_ids,
                    seen_at: new Date()
                });
                
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
                    }
                }
                
                console.log(`❌ ${senderName} disconnected`);
            }
        });
    }
}

module.exports = ChatSocket;
module.exports.getOnlineUsers = () => onlineUsers;