// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

// Generate Access Token
const generateAccessToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    });
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
    try {
        const { username, email, password, full_name, role } = req.body;

        // Check if email already exists
        const emailExists = await userRepository.isEmailExist(email);
        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Check if username already exists
        const usernameExists = await userRepository.isUsernameExist(username);
        if (usernameExists) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Create user
        const user = await userRepository.create({
            username,
            email,
            password,
            full_name,
            role: role || 'viewer'
        });

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user,
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user by email with password
        const user = await userRepository.findByEmailWithPassword(email);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        await userRepository.updateLastLogin(user._id);

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Remove password from response
        const userData = user.toObject();
        delete userData.password;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userData,
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token required'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Check if user still exists
        const user = await userRepository.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new tokens
        const newAccessToken = generateAccessToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        res.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired. Please login again.'
            });
        }
        next(error);
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
    try {
        const user = await userRepository.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    getMe
};




/*

graph LR
    A[Request] --> B{route}
    
    B -->|/register| C[register function]
    B -->|/login| D[login function]
    B -->|/refresh| E[refreshToken function]
    B -->|/me| F[getMe function]
    
    C --> G[email/username ရှိလား]
    G -->|မရှိ| H[User အသစ်ဖန်တီး]
    H --> I[Token ထုတ်ပေး]
    
    D --> J[email နဲ့ User ရှာ]
    J -->|တွေ့| K[password စစ်]
    K -->|မှန်| L[Token ထုတ်ပေး]
    
    F --> M[req.user.id နဲ့ User ရှာ]
    M --> N[User data ပြန်ပေး]

*/