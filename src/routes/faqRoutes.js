// src/routes/faqRoutes.js
const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ==================== PUBLIC ROUTES (Active only) ====================
router.get('/', faqController.getAllFaqs);
router.get('/page-info', faqController.getFaqPageInfo);
router.get('/search/:keyword', faqController.searchFaqs);
router.get('/category/:category', faqController.getFaqsByCategory);
router.get('/:id', faqController.getFaqById);

// ==================== ADMIN ROUTES (All FAQs including inactive) ====================
router.get('/admin/all', protect, authorize('admin'), faqController.getAllFaqsAdmin);
router.post('/', protect, authorize('admin'), faqController.createFaq);
router.post('/page-info', protect, authorize('admin'), faqController.updateFaqPageInfo);
router.put('/:id', protect, authorize('admin'), faqController.updateFaq);
router.put('/:id/toggle-status', protect, authorize('admin'), faqController.toggleFaqStatus);
router.delete('/:id', protect, authorize('admin'), faqController.deleteFaq);

module.exports = router;