// src/repositories/chatMessageRepository.js
const BaseRepository = require('./baseRepository');
const ChatMessage = require('../models/ChatMessage');

class ChatMessageRepository extends BaseRepository {
    constructor() {
        super(ChatMessage);
    }

    async findByRoomId(roomId, limit = 50, before = null) {
        const filter = { room_id: roomId, is_deleted: false };
        if (before) {
            filter.createdAt = { $lt: before };
        }
        return await this.findAll(
            filter,
            { sort: { createdAt: -1 }, limit: limit }
        );
    }

    async updateMany(filter, update) {
        return await this.model.updateMany(filter, update);
    }
}

module.exports = new ChatMessageRepository();