// src/middleware/errorHandler.js

/**
 * Global Error Handler Middleware
 * @desc    Application ထဲမှာ ဖြစ်တဲ့ error အားလုံးကို ဒီမှာ ကိုင်တွယ်တယ်
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('Error:', err);

    // Mongoose duplicate key error (code 11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        error.message = `${field} already exists. Please use another value.`;
        error.statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        error.message = messages.join(', ');
        error.statusCode = 400;
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        error.message = `Invalid ${err.path}: ${err.value}`;
        error.statusCode = 400;
    }

    // JWT error
    if (err.name === 'JsonWebTokenError') {
        error.message = 'Invalid token. Please login again.';
        error.statusCode = 401;
    }

    // JWT expired error
    if (err.name === 'TokenExpiredError') {
        error.message = 'Token expired. Please login again.';
        error.statusCode = 401;
    }

    // SMTP / email delivery error
    if (err.code === 'EAUTH' || /535|BadCredentials|SMTP/i.test(err.message || '')) {
        error.message = 'We could not send OTP right now. Please try again later.';
        error.statusCode = 503;
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Something went wrong on the server';

    res.status(statusCode).json({
        success: false,
        message: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;



/*

graph LR
    A[Request] --> B{protect middleware}
    
    B --> C[Header ထဲက Token ယူ]
    C --> D{Token ရှိလား}
    D -->|မရှိ| E[401 Unauthorized]
    D -->|ရှိ| F[Token Verify]
    
    F --> G{Token မှန်လား}
    G -->|မမှန်| E
    G -->|မှန်| H[User ရှာဖွေ]
    
    H --> I{User ရှိလား}
    I -->|မရှိ| E
    I -->|ရှိ| J[req.user = user]
    J --> K[Next]
    
    K --> L[Controller]
    L --> M[Response]
    
    M --> N{error ရှိလား}
    N -->|ရှိ| O[errorHandler]
    O --> P[Error Response]

*/