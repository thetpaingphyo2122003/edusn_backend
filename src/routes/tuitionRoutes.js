// src/routes/tuitionRoutes.js
const express = require('express');
const router = express.Router();
const tuitionController = require('../controllers/tuitionController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ==================== PUBLIC ROUTES ====================
// အထူးသီးသန့် routes များ (ပထမဆုံးထားရန်)
router.get('/payment-info', tuitionController.getPaymentInfo);
router.get('/virtual-attendance', tuitionController.getVirtualAttendance);
router.get('/page-info', tuitionController.getTuitionPageInfo);
router.get('/page-settings', tuitionController.getTuitionPageSettings);
router.get('/fees/category/:category', tuitionController.getFeesByCategory);

router.get('/fees/admin/all', protect, authorize('admin'), tuitionController.getAllFeesAdmin);
router.get('/fees', tuitionController.getAllFees);
router.get('/fees/:id', tuitionController.getFeeById);

// ==================== ADMIN ROUTES ====================
router.post('/fees', protect, authorize('admin'), tuitionController.createFee);
router.put('/fees/:id', protect, authorize('admin'), tuitionController.updateFee);
router.put('/fees/:id/toggle-status', protect, authorize('admin'), tuitionController.toggleFeeStatus);
router.delete('/fees/:id', protect, authorize('admin'), tuitionController.deleteFee);
router.put('/payment-info', protect, authorize('admin'), tuitionController.updatePaymentInfo);
router.put('/virtual-attendance', protect, authorize('admin'), tuitionController.updateVirtualAttendance);
router.put('/page-info', protect, authorize('admin'), tuitionController.updateTuitionPageInfo);
router.put('/page-settings', protect, authorize('admin'), tuitionController.updateTuitionPageSettings);

module.exports = router;