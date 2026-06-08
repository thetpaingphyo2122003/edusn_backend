// src/routes/leaderRoutes.js
const express = require('express');
const router = express.Router();
const leaderController = require('../controllers/leaderController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ==================== PUBLIC ROUTES ====================
router.get('/', leaderController.getAllLeaders);
router.get('/admin/all', protect, authorize('admin'), leaderController.getAllLeadersAdmin);
router.get('/position/:position', leaderController.getLeaderByPosition);
router.get('/:id', leaderController.getLeaderById);  // This should come AFTER specific routes

// ==================== ADMIN ROUTES ====================
// ✅ IMPORTANT: Specific routes MUST come before the generic :id route
router.put('/reorder', protect, authorize('admin'), leaderController.reorderLeaders);
router.post('/', protect, authorize('admin'), upload.single('image'), leaderController.createLeader);
router.put('/:id/toggle-status', protect, authorize('admin'), leaderController.toggleLeaderStatus);
router.put('/:id', protect, authorize('admin'), upload.single('image'), leaderController.updateLeader);
router.delete('/:id', protect, authorize('admin'), leaderController.deleteLeader);

module.exports = router;