const express = require('express');
const router = express.Router();
const dynamicPageController = require('../controllers/dynamicPageController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ==================== PUBLIC ROUTES (No authentication required) ====================
router.get('/published', dynamicPageController.getPublishedPages);
router.get('/slug/:slug', dynamicPageController.getPageBySlug);

// ==================== ADMIN ROUTES (Authentication required) ====================
router.get('/', protect, authorize('admin'), dynamicPageController.getAllPages);
router.get('/:id', protect, authorize('admin'), dynamicPageController.getPageById);
router.post('/', protect, authorize('admin'), dynamicPageController.createPage);
router.put('/:id', protect, authorize('admin'), dynamicPageController.updatePage);
router.delete('/:id', protect, authorize('admin'), dynamicPageController.deletePage);
router.put('/:id/publish', protect, authorize('admin'), dynamicPageController.publishPage);
router.put('/:id/unpublish', protect, authorize('admin'), dynamicPageController.unpublishPage);
router.post('/:id/duplicate', protect, authorize('admin'), dynamicPageController.duplicatePage);

// Section management routes
router.put('/:id/sections', protect, authorize('admin'), dynamicPageController.updatePageSections);
router.post('/:id/sections', protect, authorize('admin'), dynamicPageController.addSection);
router.put('/:id/sections/:sectionId', protect, authorize('admin'), dynamicPageController.updateSection);
router.delete('/:id/sections/:sectionId', protect, authorize('admin'), dynamicPageController.deleteSection);

module.exports = router;