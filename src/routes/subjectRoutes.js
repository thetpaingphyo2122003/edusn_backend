const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Add this

// ==================== Public Routes ====================
router.get('/', subjectController.getAllSubjects);
router.get('/page-settings', subjectController.getSubjectPageSettings);
router.get('/key-stage-1', subjectController.getKeyStage1);
router.get('/key-stage-2', subjectController.getKeyStage2);
router.get('/category/:category', subjectController.getSubjectsByCategory);

// ==================== Admin Only Routes ====================
router.get('/admin/all', protect, authorize('admin'), subjectController.getAllSubjectsAdmin);
router.put('/page-settings', protect, authorize('admin'), subjectController.updateSubjectPageSettings);
router.post('/', protect, authorize('admin'), upload.single('image'), subjectController.createSubject); // Add upload
router.put('/reorder', protect, authorize('admin'), subjectController.reorderSubjects);
router.put('/:id', protect, authorize('admin'), upload.single('image'), subjectController.updateSubject); // Add upload
router.delete('/:id', protect, authorize('admin'), subjectController.deleteSubject);
router.put('/:id/toggle-status', protect, authorize('admin'), subjectController.toggleSubjectStatus);

router.get('/:id', subjectController.getSubjectById);

module.exports = router;