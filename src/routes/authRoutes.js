// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter, otpLimiter } = require('../middleware/securityMiddleware');

// Public routes (no authentication required)
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authLimiter, authController.refreshToken);
router.get('/check-username', authController.checkUsernameAvailability);
router.post('/verify-email-otp', otpLimiter, authController.verifyEmailOtp);
router.post('/resend-email-otp', otpLimiter, authController.resendEmailOtp);
router.post('/forgot-password', otpLimiter, authController.forgotPassword);
router.post('/reset-password', otpLimiter, authController.resetPassword);

// Protected routes (authentication required)
router.get('/me', protect, authController.getMe);

module.exports = router;



/*

graph LR
    A[Request] --> B[server.js]
    B --> C[/api/auth/register]
    B --> D[/api/auth/login]
    B --> E[/api/auth/refresh]
    B --> F[/api/auth/me]
    
    C --> G[authController.register]
    D --> H[authController.login]
    E --> I[authController.refreshToken]
    F --> J[protect middleware]
    J --> K[authController.getMe]

*/