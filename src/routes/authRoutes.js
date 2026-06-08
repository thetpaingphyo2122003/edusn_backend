// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);

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