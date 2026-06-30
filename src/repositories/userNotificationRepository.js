const BaseRepository = require('./baseRepository');
const UserNotification = require('../models/UserNotification');

class UserNotificationRepository extends BaseRepository {
    constructor() {
        super(UserNotification);
    }

    async findForUser(userId, { limit = 50 } = {}) {
        return this.findAll(
            { user_id: userId },
            { sort: { createdAt: -1 }, limit }
        );
    }

    async getUnreadCount(userId) {
        return this.count({ user_id: userId, read: false });
    }

    async markAsRead(id, userId) {
        return this.model.findOneAndUpdate(
            { _id: id, user_id: userId },
            { $set: { read: true } },
            { new: true }
        );
    }

    async markAllAsRead(userId) {
        return this.model.updateMany(
            { user_id: userId, read: false },
            { $set: { read: true } }
        );
    }

    async deleteForUser(id, userId) {
        return this.model.findOneAndDelete({ _id: id, user_id: userId });
    }

    async createMany(entries) {
        if (!entries.length) return [];
        return UserNotification.insertMany(entries, { ordered: false });
    }
}

module.exports = new UserNotificationRepository();
