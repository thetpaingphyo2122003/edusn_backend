// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

/**
 * Protect routes - Verify JWT token
 * @desc    Token ကိုစစ်ဆေးပြီး user data ကို request ထဲထည့်ပေးတယ်
 */
const protect = async (req, res, next) => {
    try {
        let token;

        // Check if token exists in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists
        const user = await userRepository.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Invalid token.'
            });
        }

        // Check if user is active
        if (['inactive', 'suspended'].includes(user.status)) {
            return res.status(401).json({
                success: false,
                message: 'Your account is not active. Please contact admin.'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }
        next(error);
    }
};

/**
 * Authorize - Check user role
 * @param  {...String} roles - Allowed roles
 * @desc    သတ်မှတ်ထားတဲ့ role ရှိမှသာ ဆက်လုပ်ခွင့်ပြုတယ်
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (req.user.role === 'super_admin') {
            return next();
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. ${req.user.role} role is not allowed.`
            });
        }
        next();
    };
};

/**
 * Check permission - Check specific permission
 * @param {String} permission - Permission to check
 * @desc    သတ်မှတ်ထားတဲ့ permission ရှိမှသာ ဆက်လုပ်ခွင့်ပြုတယ်
 */
const hasPermission = (permission) => {
    return (req, res, next) => {
        const permissions = {
            admin: ['*'],
            editor: ['create_post', 'edit_post', 'delete_post'],
            viewer: ['view_post']
        };

        const userPermissions = permissions[req.user.role] || [];

        if (userPermissions.includes('*') || userPermissions.includes(permission)) {
            next();
        } else {
            res.status(403).json({
                success: false,
                message: `Access denied. You don't have ${permission} permission.`
            });
        }
    };
};

module.exports = {
    protect,
    authorize,
    hasPermission
};