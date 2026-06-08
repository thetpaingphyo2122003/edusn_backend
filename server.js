// server.js - CORRECTED WORKING VERSION

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const path = require('path');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./src/config/database');
const indexRoutes = require('./src/routes/index');
const User = require('./src/models/User');
const ChatSocket = require('./src/socket/chatSocket');

// Create express app
const app = express();

// ============ SECURITY MIDDLEWARE ============
app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: 'cross-origin'
        }
    })
);

// ============ CORS CONFIG ============
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (Postman/mobile apps)
            if (!origin) return callback(null, true);

            if (
                allowedOrigins.includes(origin) ||
                process.env.NODE_ENV !== 'production'
            ) {
                callback(null, true);
            } else {
                console.warn('❌ CORS blocked:', origin);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    })
);

// ============ BODY PARSER ============
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============ LOGGER ============
app.use(morgan('dev'));

// ============ STATIC FILES ============
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============ DATABASE CONNECTION ============
connectDB();

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date()
    });
});

// ============ API ROUTES ============
app.use('/api', indexRoutes);

// ============ 404 HANDLER ============
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot find ${req.originalUrl}`
    });
});

// ============ ERROR HANDLER ============
const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

// ============ CREATE HTTP SERVER ============
const server = http.createServer(app);

// ============ SOCKET.IO ============
const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
});

// ============ SOCKET AUTH MIDDLEWARE ============
io.use(async (socket, next) => {
    try {
        let token = socket.handshake.auth?.token;

        // Query token fallback
        if (!token && socket.handshake.query.token) {
            token = socket.handshake.query.token;
        }

        // Header token fallback
        if (!token && socket.handshake.headers.authorization) {
            const authHeader = socket.handshake.headers.authorization;

            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        console.log('🔑 Token received:', token ? 'YES' : 'NO');

        if (!token) {
            return next(new Error('Authentication required'));
        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return next(new Error('User not found'));
        }

        // OPTIONAL STATUS CHECK
        // Uncomment only if your User model has status field

        /*
        if (user.status !== 'active') {
            return next(new Error('Account inactive'));
        }
        */

        // Attach user to socket
        socket.user = user;

        console.log(`✅ Socket authenticated: ${user.email}`);

        next();
    } catch (error) {
        console.error('❌ Socket auth error:', error.message);
        next(new Error('Invalid token'));
    }
});

// ============ INITIALIZE CHAT SOCKET ============
new ChatSocket(io);

// Optional
app.set('io', io);

// ============ GRACEFUL SHUTDOWN ============
const gracefulShutdown = async () => {
    console.log('\n🛑 Shutting down server...');

    try {
        await mongoose.disconnect();

        console.log('✅ MongoDB disconnected');

        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    } catch (error) {
        console.error('❌ Shutdown error:', error);
        process.exit(1);
    }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// ============ UNHANDLED REJECTION ============
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API: http://localhost:${PORT}/api/health`);
    console.log(`🔌 Socket.IO enabled`);
    console.log('='.repeat(50) + '\n');
}); 