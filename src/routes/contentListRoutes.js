// src/routes/contentListRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const contentListController = require('../controllers/contentListController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Configure multer for memory storage (to work with uploadService)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: fileFilter
});

// ==================== PUBLIC ROUTES ====================
router.get('/missions', contentListController.getMissions);
router.get('/offices', contentListController.getOffices);
router.get('/pathway', contentListController.getPathway);
router.get('/quick-links', contentListController.getQuickLinks);
router.get('/item/:id', contentListController.getContentItemById);

// Generic route (must be after specific routes)
router.get('/:parentSection', contentListController.getContentByParentSection);

// ==================== ADMIN ROUTES (with auth) ====================
router.get('/', protect, authorize('admin'), contentListController.getAllContent);
router.post('/', protect, authorize('admin'), upload.single('image'), contentListController.createContentItem);
router.put('/reorder', protect, authorize('admin'), contentListController.reorderContentItems);
router.put('/:id', protect, authorize('admin'), upload.single('image'), contentListController.updateContentItem);
router.put('/:id/toggle-status', protect, authorize('admin'), contentListController.toggleContentStatus);
router.delete('/:id', protect, authorize('admin'), contentListController.deleteContentItem);

module.exports = router;