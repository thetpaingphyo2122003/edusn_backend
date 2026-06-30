const userNotificationRepository = require('../repositories/userNotificationRepository');

const getMyNotifications = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 50;
        const notifications = await userNotificationRepository.findForUser(req.user._id, { limit });
        const unread = await userNotificationRepository.getUnreadCount(req.user._id);

        res.json({
            success: true,
            count: notifications.length,
            unread,
            data: notifications,
        });
    } catch (error) {
        next(error);
    }
};

const getMyUnreadCount = async (req, res, next) => {
    try {
        const unread = await userNotificationRepository.getUnreadCount(req.user._id);
        res.json({ success: true, data: { unread } });
    } catch (error) {
        next(error);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const updated = await userNotificationRepository.markAsRead(req.params.id, req.user._id);
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

const markAllAsRead = async (req, res, next) => {
    try {
        await userNotificationRepository.markAllAsRead(req.user._id);
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
};

const deleteNotification = async (req, res, next) => {
    try {
        const deleted = await userNotificationRepository.deleteForUser(req.params.id, req.user._id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMyNotifications,
    getMyUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
