// src/routes/timetableRoutes.js
const router = require('express').Router();
const timetableController = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', timetableController.getAllTimetables);
router.get('/year/:year', timetableController.getTimetablesByYear);
router.post('/', protect, authorize('admin'), timetableController.createTimetable);
router.put('/:id', protect, authorize('admin'), timetableController.updateTimetable);
router.delete('/:id', protect, authorize('admin'), timetableController.deleteTimetable);

module.exports = router;