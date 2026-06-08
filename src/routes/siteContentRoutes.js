// src/routes/siteContentRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    getHero,
    getAbout,
    getCulture,
    getMission,
    getStatistics,
    getAttendingVirtually,
    getAllSiteContent,
    getSiteContentByKey,
    updateHero,
    updateAbout,
    updateCulture,
    updateMission,
    updateStatistics,
    updateAttendingVirtually,
    deleteSiteContent
} = require('../controllers/siteContentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Use memory storage (not disk storage) to work with uploadService
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: fileFilter
});

// Public routes
router.get('/hero', getHero);
router.get('/about', getAbout);
router.get('/culture', getCulture);
router.get('/mission', getMission);
router.get('/statistics', getStatistics);
router.get('/attending-virtually', getAttendingVirtually);
router.get('/all', getAllSiteContent);
router.get('/:sectionKey', getSiteContentByKey);

// Protected admin routes with image upload
router.put('/hero', protect, authorize('admin', 'super_admin'), upload.single('image'), updateHero);
router.put('/about', protect, authorize('admin', 'super_admin'), upload.single('image'), updateAbout);
router.put('/culture', protect, authorize('admin', 'super_admin'), upload.single('image'), updateCulture);
router.put('/mission', protect, authorize('admin', 'super_admin'), upload.single('image'), updateMission);
router.put('/statistics', protect, authorize('admin', 'super_admin'), updateStatistics);
router.put('/attending-virtually', protect, authorize('admin', 'super_admin'), updateAttendingVirtually);
router.delete('/:sectionKey', protect, authorize('admin', 'super_admin'), deleteSiteContent);

module.exports = router;