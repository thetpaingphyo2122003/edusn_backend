const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const userNotificationController = require('../controllers/userNotificationController');

router.use(protect);

router.get('/unread-count', userNotificationController.getMyUnreadCount);
router.put('/mark-all-read', userNotificationController.markAllAsRead);
router.get('/', userNotificationController.getMyNotifications);
router.put('/:id/read', userNotificationController.markAsRead);
router.delete('/:id', userNotificationController.deleteNotification);

module.exports = router;
