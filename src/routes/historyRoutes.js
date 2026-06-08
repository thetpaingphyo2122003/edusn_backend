// src/routes/historyRoutes.js
const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ==================== PUBLIC ROUTES ====================
router.get('/page-info', historyController.getHistoryPageInfo);
router.get('/timeline', historyController.getTimeline);
router.get('/year/:year', historyController.getHistoryByYear);
router.get('/:id', historyController.getHistoryById);

// ==================== ADMIN ROUTES ====================
// Page info with single image upload
router.post('/page-info', protect, authorize('admin'), upload.single('banner_image'), historyController.updateHistoryPageInfo);

// Create and update with multiple file uploads
router.post('/', protect, authorize('admin'), upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'gallery_images', maxCount: 10 }
]), historyController.createHistory);

router.put('/:id', protect, authorize('admin'), upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'gallery_images', maxCount: 10 }
]), historyController.updateHistory);

router.put('/:id/toggle-status', protect, authorize('admin'), historyController.toggleHistoryStatus);
router.delete('/:id', protect, authorize('admin'), historyController.deleteHistory);
router.get('/admin/all', protect, authorize('admin'), historyController.getAllHistoryAdmin);

module.exports = router;