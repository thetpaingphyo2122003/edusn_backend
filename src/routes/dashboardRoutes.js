const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All dashboard routes require staff/admin authentication
router.use(protect);
router.use(authorize('admin', 'super_admin', 'staff'));

// Dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);
router.get('/overview', dashboardController.getDashboardOverview);

module.exports = router;