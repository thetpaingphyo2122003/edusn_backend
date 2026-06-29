// src/controllers/authController.js
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { sendEmail } = require('../services/emailService');

const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 10);

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

const generateOtpCode = () => String(crypto.randomInt(100000, 1000000));

const getOtpExpiryDate = () => new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

const getOtpEmailTemplate = ({ otp, title, subtitle }) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#00af92,#0f233a);padding:24px;color:#ffffff;text-align:center;">
                <h1 style="margin:0;font-size:22px;line-height:1.3;">EDUSN International School</h1>
                <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">Secure One-Time Password</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 26px;">
                <h2 style="margin:0 0 10px;color:#0f233a;font-size:20px;">${title}</h2>
                <p style="margin:0 0 18px;color:#334155;font-size:14px;line-height:1.6;">${subtitle}</p>
                <div style="margin:18px 0;padding:16px;border:1px solid #d8f0ec;background:#f2fbfa;border-radius:12px;text-align:center;">
                  <p style="margin:0 0 8px;color:#0f233a;font-size:13px;">Your verification code</p>
                  <p style="margin:0;font-size:32px;letter-spacing:6px;color:#00af92;font-weight:700;">${otp}</p>
                </div>
                <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">
                  This OTP expires in <strong>${OTP_EXPIRES_MINUTES} minutes</strong>. Please do not share this code with anyone.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 26px;background:#f8fafc;color:#64748b;font-size:12px;text-align:center;">
                If you did not request this, you can ignore this email safely.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const isOtpValid = (providedOtp, storedOtp, expiresAt) => {
    if (!providedOtp) return false;
    if (!expiresAt || new Date(expiresAt).getTime() < Date.now()) return false;
    if (storedOtp && providedOtp === storedOtp) return true;
    return false;
};

const sendOtpEmail = async ({ email, otp, purpose }) => {
    const subject =
        purpose === 'verify_email'
            ? 'EDUSN Email Verification OTP'
            : 'EDUSN Password Reset OTP';
    const title = purpose === 'verify_email' ? 'Verify your email address' : 'Reset your password';
    const subtitle =
        purpose === 'verify_email'
            ? 'Use the OTP below to complete your EDUSN account verification.'
            : 'Use the OTP below to continue resetting your EDUSN account password.';
    const text = `EDUSN OTP: ${otp}. This code expires in ${OTP_EXPIRES_MINUTES} minutes.`;
    const html = getOtpEmailTemplate({ otp, title, subtitle });
    await sendEmail({ to: email, subject, text, html });
};

const buildAuthResponse = (user) => {
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const userData = user.toObject();
    delete userData.password;

    return {
        user: userData,
        accessToken,
        refreshToken,
    };
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const normalizeUsername = (username) => String(username || '').trim();

const normalizeName = (name) => String(name || '').trim().replace(/\s+/g, ' ');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidUsername = (username) => /^[a-zA-Z0-9_.-]{3,30}$/.test(username);

const validatePassword = (password) => {
    const value = String(password || '');
    if (value.length < 6) return 'Password must be at least 6 characters';
    if (value.length > 128) return 'Password is too long';
    return null;
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
    try {
        const username = normalizeUsername(req.body.username);
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || '');
        const full_name = normalizeName(req.body.full_name);

        if (!isValidUsername(username)) {
            return res.status(400).json({
                success: false,
                message: 'Use 3-30 username characters: letters, numbers, dot, underscore or hyphen.',
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'A valid email is required',
            });
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError,
            });
        }

        if (full_name && full_name.length > 120) {
            return res.status(400).json({
                success: false,
                message: 'Full name is too long',
            });
        }

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
            role: 'viewer'
        });

        if (user.role === 'viewer') {
            const otp = generateOtpCode();
            user.email_verification_otp = otp;
            user.email_verification_otp_expires_at = getOtpExpiryDate();
            await user.save();
            await sendOtpEmail({ email: user.email, otp, purpose: 'verify_email' });
        }

        res.status(201).json({
            success: true,
            message:
                user.role === 'viewer'
                    ? 'User registered successfully. Please verify your email with OTP.'
                    : 'User registered successfully',
            requiresVerification: user.role === 'viewer',
            data: user.role === 'viewer'
                ? {
                    email: user.email,
                }
                : buildAuthResponse(user),
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
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || '');

        if (!isValidEmail(email) || !password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

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

        if (user.role === 'viewer' && !user.email_verified) {
            const otp = generateOtpCode();
            user.email_verification_otp = otp;
            user.email_verification_otp_expires_at = getOtpExpiryDate();
            await user.save();
            await sendOtpEmail({ email: user.email, otp, purpose: 'verify_email' });

            return res.status(403).json({
                success: false,
                requiresVerification: true,
                message: 'Email verification required. OTP sent to your email.',
                data: {
                    email: user.email,
                },
            });
        }

        await userRepository.updateLastLogin(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            data: buildAuthResponse(user),
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
        const refreshToken = String(req.body.refreshToken || '');

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

        if (['inactive', 'suspended'].includes(user.status)) {
            return res.status(401).json({
                success: false,
                message: 'Account is not active'
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

const checkUsernameAvailability = async (req, res, next) => {
    try {
        const username = String(req.query.username || '').trim();
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required',
            });
        }

        const usernamePattern = /^[a-zA-Z0-9_.-]{3,30}$/;
        if (!usernamePattern.test(username)) {
            return res.status(400).json({
                success: false,
                available: false,
                message: 'Use 3-30 characters: letters, numbers, dot, underscore or hyphen.',
            });
        }

        const exists = await userRepository.isUsernameExist(username);
        return res.json({
            success: true,
            available: !exists,
            message: exists ? 'Username is already taken' : 'Username is available',
        });
    } catch (error) {
        next(error);
    }
};

const verifyEmailOtp = async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const otp = String(req.body.otp || '').trim();
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required',
            });
        }

        const user = await userRepository.findByEmailWithPassword(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (!isOtpValid(otp, user.email_verification_otp, user.email_verification_otp_expires_at)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP',
            });
        }

        user.email_verified = true;
        user.email_verification_otp = null;
        user.email_verification_otp_expires_at = null;
        await user.save();
        await userRepository.updateLastLogin(user._id);

        return res.json({
            success: true,
            message: 'Email verified successfully',
            data: buildAuthResponse(user),
        });
    } catch (error) {
        next(error);
    }
};

const resendEmailOtp = async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        const user = await userRepository.findByEmail(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (user.email_verified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified',
            });
        }

        const otp = generateOtpCode();
        user.email_verification_otp = otp;
        user.email_verification_otp_expires_at = getOtpExpiryDate();
        await user.save();
        await sendOtpEmail({ email: user.email, otp, purpose: 'verify_email' });

        return res.json({
            success: true,
            message: 'Verification OTP sent',
            data: { email: user.email },
        });
    } catch (error) {
        next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        const user = await userRepository.findByEmail(email);
        if (user) {
            const otp = generateOtpCode();
            user.reset_password_otp = otp;
            user.reset_password_otp_expires_at = getOtpExpiryDate();
            await user.save();
            await sendOtpEmail({ email: user.email, otp, purpose: 'reset_password' });
        }

        return res.json({
            success: true,
            message: 'If the email exists, an OTP has been sent.',
            data: {},
        });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const otp = String(req.body.otp || '').trim();
        const newPassword = String(req.body.newPassword || '');
        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP and new password are required',
            });
        }
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError,
            });
        }

        const user = await userRepository.findByEmailWithPassword(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (!isOtpValid(otp, user.reset_password_otp, user.reset_password_otp_expires_at)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP',
            });
        }

        await userRepository.resetPassword(user._id, newPassword);

        user.reset_password_otp = null;
        user.reset_password_otp_expires_at = null;
        await user.save();

        return res.json({
            success: true,
            message: 'Password reset successful. Please login.',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    getMe,
    checkUsernameAvailability,
    verifyEmailOtp,
    resendEmailOtp,
    forgotPassword,
    resetPassword,
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