// src/routes/awardRoutes.js
const express = require('express');
const router = express.Router();
const awardController = require('../controllers/awardController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ==================== PUBLIC ROUTES ====================
router.get('/teacher/:year', awardController.getTeacherAwards);
router.get('/student/:year', awardController.getStudentAwards);
router.get('/year/:year', awardController.getAwardsByYear);
router.get('/campus/:campus', awardController.getAwardsByCampus);
router.get('/', awardController.getAllAwards);
router.get('/:id', awardController.getAwardById);

// ==================== ADMIN ROUTES ====================
// ✅ NEW: Admin endpoint to get ALL awards (including inactive)
router.get('/admin/all', protect, authorize('admin'), awardController.getAllAwardsAdmin);
router.get('/admin/status/:status', protect, authorize('admin'), awardController.getAwardsByStatus);

router.post('/bulk', protect, authorize('admin'), awardController.bulkCreateAwards);
router.post('/', protect, authorize('admin'), awardController.createAward);
router.put('/:id', protect, authorize('admin'), awardController.updateAward);
router.put('/:id/toggle-status', protect, authorize('admin'), awardController.toggleAwardStatus);
router.delete('/:id', protect, authorize('admin'), awardController.deleteAward);

module.exports = router;