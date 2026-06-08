// src/routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ==================== Public Routes ====================
router.get('/', blogController.getAllBlogs);
router.get('/recent', blogController.getRecentBlogs);
router.get('/popular', blogController.getPopularBlogs);
router.get('/year/:year', blogController.getBlogsByYear);
router.get('/slug/:slug', blogController.getBlogBySlug);
router.get('/:id/related', blogController.getRelatedBlogs);
router.post('/:id/comments', blogController.addComment);

// ==================== Admin Routes ====================
router.get('/admin/all', protect, authorize('admin', 'editor'), blogController.getAllBlogsAdmin);
router.get('/admin/stats', protect, authorize('admin'), blogController.getBlogStats);
router.get('/id/:id', protect, authorize('admin', 'editor'), blogController.getBlogById);
router.post('/', protect, authorize('admin', 'editor'), upload.single('image'), blogController.createBlog);
router.put('/:id', protect, authorize('admin', 'editor'), upload.single('image'), blogController.updateBlog);
router.put('/:id/publish', protect, authorize('admin', 'editor'), blogController.publishBlog);
router.put('/:id/unpublish', protect, authorize('admin', 'editor'), blogController.unpublishBlog);
router.delete('/:id', protect, authorize('admin', 'editor'), blogController.deleteBlog);

module.exports = router;