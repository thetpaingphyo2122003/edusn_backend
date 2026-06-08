const BaseRepository = require('./baseRepository');
const Notification = require('../models/Notification');

class NotificationRepository extends BaseRepository {
    constructor() {
        super(Notification);
    }

    async getUnreadCount() {
        return await this.count({ read: false });
    }

    async getRecentNotifications(limit = 20) {
        return await this.findAll(
            {},
            { sort: { createdAt: -1 }, limit: limit }
        );
    }

    async getNotificationsByType(type) {
        return await this.findAll(
            { type: type },
            { sort: { createdAt: -1 } }
        );
    }

    async markAsRead(id) {
        return await this.updateById(id, { read: true });
    }

    async markAllAsRead() {
        return await this.model.updateMany(
            { read: false },
            { $set: { read: true } }
        );
    }

    async deleteReadNotifications() {
        return await this.model.deleteMany({ read: true });
    }

    async getStats() {
        const total = await this.count({});
        const unread = await this.count({ read: false });
        const read = await this.count({ read: true });
        
        return { total, unread, read };
    }

    async createNotification(data) {
        return await this.create(data);
    }
}

module.exports = new NotificationRepository();