// src/routes/partnerRoutes.js
const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ==================== PUBLIC ROUTES ====================
// 1. Static routes (ပုံသေလမ်းကြောင်းများ)
router.get('/universities', partnerController.getUniversities);
router.get('/progression-routes', partnerController.getProgressionRoutes);
router.get('/search', partnerController.searchProgressionRoutes);

// 2. Admin routes
router.get('/admin/all', protect, authorize('admin'), partnerController.getAllPartnersAdmin);
router.put('/reorder', protect, authorize('admin'), partnerController.reorderPartners);

// 3. General GET all
router.get('/', partnerController.getAllPartners);

// 4. Dynamic routes (/:id) - အောက်ဆုံးမှာထားရန်
router.get('/:id', partnerController.getPartnerById);
router.put('/:id', protect, authorize('admin'), upload.single('image'), partnerController.updatePartner);
router.put('/:id/toggle-status', protect, authorize('admin'), partnerController.togglePartnerStatus);
router.delete('/:id', protect, authorize('admin'), partnerController.deletePartner);

// 5. Create route (POST)
router.post('/', protect, authorize('admin'), upload.single('image'), partnerController.createPartner);

module.exports = router;