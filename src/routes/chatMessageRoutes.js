// src/routes/chatMessageRoutes.js

const express = require('express');
const router = express.Router();
const chatMessageController = require('../controllers/chatMessageController');
const { protect } = require('../middleware/authMiddleware');
const { chatWriteLimiter } = require('../middleware/securityMiddleware');

router.use(protect);

// ✅ Support message route
router.post('/support', chatWriteLimiter, chatMessageController.sendSupportMessage);

// Regular message routes
router.get('/:roomId', chatMessageController.getMessages);
router.post('/', chatWriteLimiter, chatMessageController.sendMessage);
router.put('/:messageId', chatWriteLimiter, chatMessageController.editMessage);
router.delete('/:messageId', chatWriteLimiter, chatMessageController.deleteMessage);
router.put('/:messageId/delete-for-me', chatWriteLimiter, chatMessageController.deleteMessageForMe);
router.put('/read-all/:roomId', chatWriteLimiter, chatMessageController.markAllAsRead);

module.exports = router;