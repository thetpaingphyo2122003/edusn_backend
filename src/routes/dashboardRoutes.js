const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// All dashboard routes require authentication
router.use(protect);

// Dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);
router.get('/overview', dashboardController.getDashboardOverview);

module.exports = router;