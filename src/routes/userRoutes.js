// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ==================== USER PROFILE ROUTES (Specific paths - NO params) ====================
// These MUST come first to avoid being caught by /:id routes
router.get('/profile', protect, userController.getMyProfile);
router.put('/profile', protect, userController.updateMyProfile);
router.get('/profile/me', protect, userController.getMyProfile);
router.put('/profile/me', protect, userController.updateMyProfile);

// ==================== PASSWORD CHANGE ROUTE ====================
router.put('/change-password', protect, userController.changeMyPassword);

// ==================== STATS ROUTE ====================
router.get('/stats', protect, authorize('admin'), userController.getUserStats);

// ==================== LIST ALL USERS (No params) ====================
router.get('/', protect, userController.getAllUsers);

// ==================== CREATE USER (No params) ====================
router.post('/', protect, authorize('admin'), userController.createUser);

// ==================== ROUTES WITH PARAMETERS (:id) - MUST COME LAST ====================
// Status routes
router.get('/:id/status', protect, userController.getUserStatus);

// Get single user
router.get('/:id', protect, userController.getUserById);

// Admin update routes
router.put('/:id/toggle-status', protect, authorize('admin'), userController.toggleUserStatus);
router.put('/:id/change-role', protect, authorize('admin'), userController.changeUserRole);
router.put('/:id/reset-password', protect, authorize('admin'), userController.resetUserPassword);
router.put('/:id', protect, authorize('admin'), userController.updateUser);
router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

module.exports = router;    