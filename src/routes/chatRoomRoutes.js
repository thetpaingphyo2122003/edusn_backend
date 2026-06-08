// src/routes/chatRoomRoutes.js

const express = require('express');
const router = express.Router();
const chatRoomController = require('../controllers/chatRoomController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// ✅ Support chat routes (must come before generic routes)
router.post('/support/create', chatRoomController.getOrCreateSupportChat);
router.get('/support/all', authorize('admin', 'staff'), chatRoomController.getSupportChatsForStaff);
router.get('/support/my', chatRoomController.getMySupportChats);

// Personal chat routes
router.get('/', chatRoomController.getMyChatRooms);
router.post('/personal', chatRoomController.createPersonalChatRoom);
router.put('/:roomId/mute', chatRoomController.muteRoom);
router.delete('/:roomId', chatRoomController.deleteRoom);
router.delete('/:roomId/clear-history', chatRoomController.clearChatHistory);

module.exports = router;