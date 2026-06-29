const notificationRepository = require('../repositories/notificationRepository');
const NotificationService = require('../services/notificationService');
const {
    broadcastRead,
    broadcastAllRead,
    broadcastDeleted
} = require('../utils/notificationEmitter');

/**
 * @desc    Get all notifications
 * @route   GET /api/notifications
 * @access  Private (Admin)
 */
const getAllNotifications = async (req, res, next) => {
    try {
        const { type, limit } = req.query;
        let notifications;
        
        if (type) {
            notifications = await notificationRepository.getNotificationsByType(type);
        } else if (limit) {
            notifications = await notificationRepository.getRecentNotifications(parseInt(limit));
        } else {
            notifications = await notificationRepository.getRecentNotifications(50);
        }
        
        res.json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        console.error('Get all notifications error:', error);
        next(error);
    }
};

/**
 * @desc    Get notification statistics
 * @route   GET /api/notifications/stats
 * @access  Private (Admin)
 */
const getNotificationStats = async (req, res, next) => {
    try {
        const stats = await notificationRepository.getStats();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get notification stats error:', error);
        next(error);
    }
};

/**
 * @desc    Get unread count
 * @route   GET /api/notifications/unread-count
 * @access  Private (Admin)
 */
const getUnreadCount = async (req, res, next) => {
    try {
        const count = await notificationRepository.getUnreadCount();
        
        res.json({
            success: true,
            data: { unread: count }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        next(error);
    }
};

/**
 * @desc    Get single notification by id
 * @route   GET /api/notifications/:id
 * @access  Private (Admin)
 */
const getNotificationById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notification = await notificationRepository.findById(id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Get notification by id error:', error);
        next(error);
    }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private (Admin)
 */
const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const notification = await notificationRepository.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        const updated = await notificationRepository.markAsRead(id);
        broadcastRead(id);
        
        res.json({
            success: true,
            message: 'Notification marked as read',
            data: updated
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        next(error);
    }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/mark-all-read
 * @access  Private (Admin)
 */
const markAllAsRead = async (req, res, next) => {
    try {
        await notificationRepository.markAllAsRead();
        broadcastAllRead();
        
        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        next(error);
    }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (Admin)
 */
const deleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const notification = await notificationRepository.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        
        await notificationRepository.deleteById(id);
        broadcastDeleted(id);
        
        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        next(error);
    }
};

/**
 * @desc    Delete all read notifications
 * @route   DELETE /api/notifications/read
 * @access  Private (Admin)
 */
const deleteReadNotifications = async (req, res, next) => {
    try {
        const result = await notificationRepository.deleteReadNotifications();
        
        res.json({
            success: true,
            message: `${result.deletedCount} read notifications deleted successfully`
        });
    } catch (error) {
        console.error('Delete read notifications error:', error);
        next(error);
    }
};

/**
 * @desc    Create notification (internal use)
 * @route   POST /api/notifications
 * @access  Private (Admin)
 */
const createNotification = async (req, res, next) => {
    try {
        const { type, title, message, link, reference_id, reference_model } = req.body;

        const notification = await NotificationService.create({
            type: type || 'announcement',
            title,
            message,
            link: link || '/admin/dashboard',
            reference_id: reference_id || null,
            reference_model: reference_model || null,
            created_by: req.user._id
        });
        
        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: notification
        });
    } catch (error) {
        console.error('Create notification error:', error);
        next(error);
    }
};

module.exports = {
    getAllNotifications,
    getNotificationStats,
    getUnreadCount,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
    createNotification
};