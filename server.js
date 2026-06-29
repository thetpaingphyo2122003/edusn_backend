// server.js - CORRECTED WORKING VERSION

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./src/config/database');
const indexRoutes = require('./src/routes/index');
const User = require('./src/models/User');
const ChatSocket = require('./src/socket/chatSocket');
const {
    buildAllowedOrigins,
    buildHelmetOptions,
    generalApiLimiter,
    setSpaStaticHeaders,
    setUploadStaticHeaders,
    validateSecurityEnv,
} = require('./src/middleware/securityMiddleware');

validateSecurityEnv();

const isProduction = process.env.NODE_ENV === 'production';

// Create express app
const app = express();

if (isProduction || process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
}

if (isProduction) {
    app.use(compression());
}

// ============ SECURITY MIDDLEWARE ============
app.use(
    helmet(buildHelmetOptions(buildAllowedOrigins()))
);

// ============ CORS CONFIG ============
const allowedOrigins = buildAllowedOrigins();

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
const bodyLimit = process.env.API_BODY_LIMIT || '5mb';
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

// ============ LOGGER ============
app.use(morgan(isProduction ? 'combined' : 'dev'));

// ============ STATIC FILES ============
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    dotfiles: 'deny',
    fallthrough: false,
    index: false,
    setHeaders: setUploadStaticHeaders,
}));

// ============ DATABASE CONNECTION ============
connectDB();

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date()
    });
});

// ============ API ROUTES ============
app.use('/api', generalApiLimiter);
app.use('/api', indexRoutes);

// ============ ADMIN PANEL (production) ============
if (isProduction) {
    const adminDist = path.join(__dirname, '../edusn_admin/dist');

    if (fs.existsSync(adminDist)) {
        app.use(express.static(adminDist, {
            index: false,
            setHeaders: setSpaStaticHeaders,
        }));

        // SPA routes: /admin/* and /staff/*
        app.get(/^\/(admin|staff)(\/.*)?$/, (req, res) => {
            res.sendFile(path.join(adminDist, 'index.html'));
        });

        if (process.env.ROOT_REDIRECT_ADMIN === 'true') {
            app.get('/', (req, res) => {
                res.redirect('/admin/login');
            });
        }

        console.log('📦 Admin panel served from', adminDist);
    } else {
        console.warn('⚠️  Admin dist not found. Run: npm run build:admin');
    }
}

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

        // Query token fallback is disabled in production because URLs are often logged.
        if (!token && process.env.NODE_ENV !== 'production' && socket.handshake.query.token) {
            token = socket.handshake.query.token;
        }

        // Header token fallback
        if (!token && socket.handshake.headers.authorization) {
            const authHeader = socket.handshake.headers.authorization;

            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (process.env.NODE_ENV !== 'production') {
            console.log('🔑 Socket token received:', token ? 'YES' : 'NO');
        }

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

        if (['inactive', 'suspended'].includes(user.status)) {
            return next(new Error('Account inactive'));
        }

        // Attach user to socket
        socket.user = user;

        if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ Socket authenticated: ${user.email}`);
        }

        next();
    } catch (error) {
        console.error('❌ Socket auth error:', error.message);
        next(new Error('Invalid token'));
    }
});

// ============ INITIALIZE CHAT SOCKET ============
new ChatSocket(io);

const { setNotificationIo } = require('./src/utils/notificationEmitter');
setNotificationIo(io);

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