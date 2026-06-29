const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const STAFF_ROLES = ['admin', 'super_admin', 'staff', 'editor'];
const ADMIN_ROLES = ['admin', 'super_admin'];

router.use(protect);

// Read + mark read — staff and admins
router.get('/stats', authorize(...STAFF_ROLES), notificationController.getNotificationStats);
router.get('/unread-count', authorize(...STAFF_ROLES), notificationController.getUnreadCount);
router.put('/mark-all-read', authorize(...STAFF_ROLES), notificationController.markAllAsRead);
router.get('/', authorize(...STAFF_ROLES), notificationController.getAllNotifications);
router.get('/:id', authorize(...STAFF_ROLES), notificationController.getNotificationById);
router.put('/:id/read', authorize(...STAFF_ROLES), notificationController.markAsRead);

// Create + delete — admins only
router.post('/', authorize(...ADMIN_ROLES), notificationController.createNotification);
router.delete('/read', authorize(...ADMIN_ROLES), notificationController.deleteReadNotifications);
router.delete('/:id', authorize(...ADMIN_ROLES), notificationController.deleteNotification);

module.exports = router;
