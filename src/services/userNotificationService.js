const User = require('../models/User');
const userNotificationRepository = require('../repositories/userNotificationRepository');
const { emitToUser } = require('../utils/notificationEmitter');

const ROLE_MAP = {
    users: ['viewer'],
    staff: ['staff'],
    everyone: ['viewer', 'staff'],
};

const normalizeUserLink = (link) => {
    if (!link || typeof link !== 'string') return '/';
    const trimmed = link.trim();
    if (trimmed.startsWith('/admin') || trimmed.startsWith('/staff')) {
        return '/';
    }
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

class UserNotificationService {
    static async broadcastToAudience(audience, payload, createdBy) {
        const roles = ROLE_MAP[audience];
        if (!roles?.length) return [];

        const users = await User.find({ role: { $in: roles }, status: 'active' }).select('_id');
        if (!users.length) return [];

        const link = normalizeUserLink(payload.link);
        const entries = users.map((user) => ({
            user_id: user._id,
            type: payload.type || 'announcement',
            title: payload.title,
            message: payload.message,
            link,
            read: false,
            source: 'announcement',
            admin_notification_id: payload.admin_notification_id || null,
            created_by: createdBy || null,
        }));

        const created = await userNotificationRepository.createMany(entries);

        created.forEach((doc) => {
            emitToUser(doc.user_id.toString(), 'user_notification', {
                success: true,
                data: doc,
            });
        });

        return created;
    }
}

module.exports = UserNotificationService;
