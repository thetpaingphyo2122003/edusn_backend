// src/routes/chatMessageRoutes.js

const express = require('express');
const router = express.Router();
const chatMessageController = require('../controllers/chatMessageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// ✅ Support message route
router.post('/support', chatMessageController.sendSupportMessage);

// Regular message routes
router.get('/:roomId', chatMessageController.getMessages);
router.post('/', chatMessageController.sendMessage);
router.put('/:messageId', chatMessageController.editMessage);
router.delete('/:messageId', chatMessageController.deleteMessage);
router.put('/:messageId/delete-for-me', chatMessageController.deleteMessageForMe);
router.put('/read-all/:roomId', chatMessageController.markAllAsRead);

module.exports = router;