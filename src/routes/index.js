// src/routes/index.js
const express = require('express');
const router = express.Router();

// Import all route files
const authRoutes = require('./authRoutes');
const blogRoutes = require('./blogRoutes');
const testimonialRoutes = require('./testimonialRoutes');
const leaderRoutes = require('./leaderRoutes');
const subjectRoutes = require('./subjectRoutes');
const igcseCourseRoutes = require('./igcseCourseRoutes');
const faqRoutes = require('./faqRoutes'); 
const historyRoutes = require('./historyRoutes');
const awardRoutes = require('./awardRoutes');
const contactInfoRoutes = require('./contactInfoRoutes');
const tuitionRoutes = require('./tuitionRoutes');
const siteContentRoutes = require('./siteContentRoutes');
const contentListRoutes = require('./contentListRoutes');
const chatRoomRoutes = require('./chatRoomRoutes');
const chatMessageRoutes = require('./chatMessageRoutes');
const timetableRoutes = require('./timetableRoutes');
const partnerRoutes = require('./partnerRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const userRoutes = require('./userRoutes');
const notificationRoutes = require('./notificationRoutes');
const dynamicPageRoutes = require('./dynamicPageRoutes');
const uploadRoutes = require('./uploadRoutes');  // ✅ Add this line

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
        timestamp: new Date(),
        environment: process.env.NODE_ENV
    });
});

// API version v1 routes
router.use('/auth', authRoutes);
router.use('/blogs', blogRoutes);
router.use('/testimonials', testimonialRoutes); 
router.use('/leaders', leaderRoutes);
router.use('/subjects', subjectRoutes);
router.use('/courses', igcseCourseRoutes);
router.use('/faqs', faqRoutes);
router.use('/history', historyRoutes);
router.use('/awards', awardRoutes);
router.use('/contact', contactInfoRoutes);
router.use('/tuition', tuitionRoutes);
router.use('/site-content', siteContentRoutes);
router.use('/content-lists', contentListRoutes);
router.use('/chat/rooms', chatRoomRoutes);
router.use('/chat/messages', chatMessageRoutes);
router.use('/timetables', timetableRoutes);
router.use('/partners', partnerRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dynamic-pages', dynamicPageRoutes);
router.use('/upload', uploadRoutes);  // ✅ Add this line

module.exports = router;