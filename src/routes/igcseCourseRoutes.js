// src/routes/igcseCourseRoutes.js
const express = require('express');
const router = express.Router();
const igcseCourseController = require('../controllers/igcseCourseController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ==================== PUBLIC ROUTES ====================
// Specific routes FIRST (before dynamic :slug)
router.get('/igcse', igcseCourseController.getIGCSECourses);
router.get('/a-level', igcseCourseController.getALevelCourses);
router.get('/id/:id', igcseCourseController.getCourseById);

// Then the generic routes
router.get('/', igcseCourseController.getAllCourses);

// Dynamic route MUST be LAST
router.get('/:slug', igcseCourseController.getCourseBySlug);

// ==================== ADMIN ROUTES ====================
router.get('/admin/all', protect, authorize('admin'), igcseCourseController.getAllCoursesAdmin);
router.post('/', protect, authorize('admin'), upload.single('image'), igcseCourseController.createCourse);
router.put('/:id', protect, authorize('admin'), upload.single('image'), igcseCourseController.updateCourse);
router.put('/:id/tabs', protect, authorize('admin'), igcseCourseController.updateCourseTabs);
router.put('/:id/toggle-status', protect, authorize('admin'), igcseCourseController.toggleCourseStatus);
router.put('/reorder', protect, authorize('admin'), igcseCourseController.reorderCourses);
router.delete('/:id', protect, authorize('admin'), igcseCourseController.deleteCourse);

module.exports = router;