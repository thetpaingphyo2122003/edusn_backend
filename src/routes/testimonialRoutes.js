// src/routes/testimonialRoutes.js
const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ==================== PUBLIC ROUTES ====================
router.get('/', testimonialController.getAllTestimonials);
router.get('/page-settings', testimonialController.getTestimonialPageSettings);
router.get('/role/:role', testimonialController.getTestimonialsByRole);
router.get('/:id', testimonialController.getTestimonialById);
router.post('/', upload.single('image'), testimonialController.createTestimonial);

// ==================== ADMIN ROUTES ====================
router.get('/admin/all', protect, authorize('admin'), testimonialController.getAllTestimonialsAdmin);
router.get('/admin/pending', protect, authorize('admin'), testimonialController.getPendingTestimonials);
router.get('/admin/stats', protect, authorize('admin'), testimonialController.getTestimonialStats);
router.put('/page-settings', protect, authorize('admin'), testimonialController.updateTestimonialPageSettings);
router.put('/:id/approve', protect, authorize('admin'), testimonialController.approveTestimonial);
router.put('/:id/reject', protect, authorize('admin'), testimonialController.rejectTestimonial);
router.put('/:id', protect, authorize('admin'), upload.single('image'), testimonialController.updateTestimonial);
router.delete('/:id', protect, authorize('admin'), testimonialController.deleteTestimonial);

module.exports = router;