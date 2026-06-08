// src/repositories/chatRoomRepository.js
const BaseRepository = require('./baseRepository');
const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');

class ChatRoomRepository extends BaseRepository {
    constructor() {
        super(ChatRoom);
    }

    async findByRoomId(roomId) {
        return await this.findOne({ room_id: roomId });
    }

    async findByUserId(userId) {
        return await this.findAll(
            { 'participants.user_id': userId, status: 'active' },
            { sort: { updatedAt: -1 } }
        );
    }

    async findPersonalChat(user1Id, user2Id) {
        const roomId = [user1Id, user2Id].sort().join('_');
        return await this.findByRoomId(roomId);
    }

    async updateLastMessage(roomId, message, senderName, messageType) {
        return await this.updateOne(
            { room_id: roomId },
            {
                last_message: {
                    message: message,
                    sender_name: senderName,
                    sent_at: new Date(),
                    message_type: messageType
                },
                updatedAt: new Date()
            }
        );
    }

    async updateLastRead(roomId, userId) {
        return await this.updateOne(
            { room_id: roomId, 'participants.user_id': userId },
            { $set: { 'participants.$.last_read_at': new Date() } }
        );
    }

    async muteRoom(roomId, userId, muted = true) {
        return await this.updateOne(
            { room_id: roomId, 'participants.user_id': userId },
            { $set: { 'participants.$.is_muted': muted } }
        );
    }

    async deleteRoom(roomId, userId) {
        return await this.updateOne(
            { room_id: roomId },
            { status: 'deleted', $push: { deleted_by: userId } }
        );
    }

    async getUnreadCount(roomId, userId, lastReadAt) {
        return await ChatMessage.countDocuments({
            room_id: roomId,
            createdAt: { $gt: lastReadAt },
            'sender.user_id': { $ne: userId },
            is_deleted: false,
            'read_by.user_id': { $ne: userId }
        });
    }

    async clearHistoryForUser(roomId, userId) {
        return await ChatMessage.updateMany(
            { room_id: roomId },
            { $addToSet: { deleted_by: userId } }
        );
    }
}

module.exports = new ChatRoomRepository();