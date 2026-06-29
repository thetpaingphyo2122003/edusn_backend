const { rateLimit } = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';

const parseOrigins = (value) =>
    (value || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

const buildAllowedOrigins = () => [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    ...parseOrigins(process.env.CORS_ORIGINS),
].filter(Boolean);

const buildHelmetOptions = (allowedOrigins = []) => ({
    crossOriginResourcePolicy: {
        policy: 'cross-origin',
    },
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            objectSrc: ["'none'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'none'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
            mediaSrc: ["'self'", 'blob:', 'https:', 'http:'],
            connectSrc: ["'self'", 'ws:', 'wss:', ...allowedOrigins],
            frameSrc: ["'self'", 'https://www.youtube.com', 'https://www.youtube-nocookie.com'],
            upgradeInsecureRequests: isProduction ? [] : null,
        },
    },
});

const createLimiter = ({ windowMs, max, message }) =>
    rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message,
        },
    });

const generalApiLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 600 : 2000,
    message: 'Too many requests. Please try again later.',
});

const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 20 : 100,
    message: 'Too many authentication attempts. Please try again later.',
});

const otpLimiter = createLimiter({
    windowMs: 10 * 60 * 1000,
    max: isProduction ? 8 : 50,
    message: 'Too many OTP requests. Please wait before trying again.',
});

const uploadLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 80 : 300,
    message: 'Too many upload requests. Please try again later.',
});

const chatWriteLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: isProduction ? 60 : 300,
    message: 'Too many chat actions. Please slow down.',
});

const setUploadStaticHeaders = (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cache-Control', 'private, max-age=86400');
};

const setSpaStaticHeaders = (res, filePath) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    if (filePath && filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
    }
};

const validateSecurityEnv = () => {
    const requiredInProduction = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'];
    const weakSecretValues = new Set([
        'secret',
        'changeme',
        'change-this-to-a-long-random-string',
        'change-this-refresh-secret-too',
    ]);

    const problems = [];

    requiredInProduction.forEach((name) => {
        const value = process.env[name];
        if (!value) {
            problems.push(`${name} is missing`);
            return;
        }

        if (name.includes('JWT') && (value.length < 32 || weakSecretValues.has(value))) {
            problems.push(`${name} must be a strong random value of at least 32 characters`);
        }
    });

    if (isProduction && problems.length) {
        throw new Error(`Security environment validation failed: ${problems.join('; ')}`);
    }

    if (problems.length) {
        console.warn(`Security environment warning: ${problems.join('; ')}`);
    }
};

module.exports = {
    authLimiter,
    buildAllowedOrigins,
    buildHelmetOptions,
    chatWriteLimiter,
    generalApiLimiter,
    otpLimiter,
    setSpaStaticHeaders,
    setUploadStaticHeaders,
    uploadLimiter,
    validateSecurityEnv,
};
