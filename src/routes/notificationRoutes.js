const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ==================== PROTECTED ROUTES (Admin only) ====================
router.use(protect, authorize('admin'));

// Stats and counts
router.get('/stats', notificationController.getNotificationStats);
router.get('/unread-count', notificationController.getUnreadCount);

// Bulk operations
router.put('/mark-all-read', notificationController.markAllAsRead);
router.delete('/read', notificationController.deleteReadNotifications);

// CRUD operations
router.get('/', notificationController.getAllNotifications);
router.get('/:id', notificationController.getNotificationById);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);
router.post('/', notificationController.createNotification);

module.exports = router;