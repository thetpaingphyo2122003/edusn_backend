// src/routes/contactInfoRoutes.js
const express = require('express');
const router = express.Router();
const contactInfoController = require('../controllers/contactInfoController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ==================== PUBLIC ROUTES ====================
// အထူးသီးသန့် routes များ (ပထမဆုံးထားရန်)
router.get('/campuses', contactInfoController.getCampuses);
router.get('/offices', contactInfoController.getOffices);
router.get('/name/:name', contactInfoController.getContactByName);

// အထွေထွေ routes များ
router.get('/', contactInfoController.getAllContactInfo);
router.get('/:id', contactInfoController.getContactById);

// ==================== ADMIN ROUTES ====================
router.post('/', protect, authorize('admin'), contactInfoController.createContact);
router.put('/:id', protect, authorize('admin'), contactInfoController.updateContact);
router.put('/:id/toggle-status', protect, authorize('admin'), contactInfoController.toggleContactStatus);
router.put('/reorder', protect, authorize('admin'), contactInfoController.reorderContact);
router.delete('/:id', protect, authorize('admin'), contactInfoController.deleteContact);

module.exports = router;