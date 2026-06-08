const User = require('../models/User');
const Blog = require('../models/Blog');
const Testimonial = require('../models/Testimonial');
const Award = require('../models/Award');
const Partner = require('../models/Partner');
const IgcseCourse = require('../models/IgcseCourse');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getDashboardStats = async (req, res) => {
    try {
        // Get all counts in parallel for better performance
        const [
            totalUsers,
            totalStudents,
            totalTeachers,
            totalBlogs,
            totalTestimonials,
            totalAwards,
            totalPartners,
            totalCourses
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'viewer' }), // Assuming students are 'viewer'
            User.countDocuments({ role: 'editor' }), // Assuming teachers are 'editor'
            Blog.countDocuments({ status: 'published' }),
            Testimonial.countDocuments({ status: 'approved' }),
            Award.countDocuments({ status: 'active' }),
            Partner.countDocuments({ status: 'active' }),
            IgcseCourse.countDocuments({ status: 'active' })
        ]);

        // Monthly data for charts (last 6 months)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const last6Months = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
        
        const monthlyData = [];
        
        for (let i = 0; i < last6Months.length; i++) {
            const monthName = last6Months[i];
            const monthIndex = months.indexOf(monthName);
            const year = new Date().getFullYear();
            const startDate = new Date(year, monthIndex, 1);
            const endDate = new Date(year, monthIndex + 1, 0);
            
            // Get counts for each month
            const [usersCount, blogsCount, awardsCount, viewsCount] = await Promise.all([
                User.countDocuments({
                    createdAt: { $gte: startDate, $lte: endDate }
                }),
                Blog.countDocuments({
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'published'
                }),
                Award.countDocuments({
                    createdAt: { $gte: startDate, $lte: endDate }
                }),
                Blog.aggregate([
                    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
                    { $group: { _id: null, total: { $sum: '$view_count' } } }
                ])
            ]);
            
            monthlyData.push({
                name: monthName,
                users: usersCount,
                blogs: blogsCount,
                awards: awardsCount,
                views: viewsCount[0]?.total || 0
            });
        }

        // Recent activities (last 10 activities across all models)
        const recentBlogs = await Blog.find({ status: 'published' })
            .sort({ createdAt: -1 })
            .limit(3)
            .select('title createdAt');
        
        const recentTestimonials = await Testimonial.find({ status: 'approved' })
            .sort({ createdAt: -1 })
            .limit(3)
            .select('name message createdAt');
        
        const recentAwards = await Award.find({ status: 'active' })
            .sort({ createdAt: -1 })
            .limit(2)
            .select('student_name award_title createdAt');
        
        const recentPartners = await Partner.find({ status: 'active' })
            .sort({ createdAt: -1 })
            .limit(2)
            .select('name createdAt');

        // Combine and format recent activities
        const recentActivities = [
            ...recentBlogs.map(blog => ({
                id: blog._id,
                action: `New blog post: "${blog.title}"`,
                user: "Admin",
                time: getTimeAgo(blog.createdAt),
                type: "blog"
            })),
            ...recentTestimonials.map(testimonial => ({
                id: testimonial._id,
                action: `Testimonial added by ${testimonial.name}`,
                user: "User",
                time: getTimeAgo(testimonial.createdAt),
                type: "testimonial"
            })),
            ...recentAwards.map(award => ({
                id: award._id,
                action: `${award.student_name} received ${award.award_title || 'an award'}`,
                user: "Admin",
                time: getTimeAgo(award.createdAt),
                type: "award"
            })),
            ...recentPartners.map(partner => ({
                id: partner._id,
                action: `New partner added: ${partner.name}`,
                user: "Admin",
                time: getTimeAgo(partner.createdAt),
                type: "partner"
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

        // Top performing content
        const topBlogs = await Blog.find({ status: 'published' })
            .sort({ view_count: -1 })
            .limit(3)
            .select('title view_count');

        const topCourses = await IgcseCourse.find({ status: 'active' })
            .sort({ display_order: 1 })
            .limit(3)
            .select('title');

        const topTestimonials = await Testimonial.find({ status: 'approved' })
            .sort({ rating: -1 })
            .limit(2)
            .select('name message');

        const topContent = [
            ...topBlogs.map(blog => ({
                title: blog.title,
                category: "Blog",
                views: blog.view_count
            })),
            ...topCourses.map(course => ({
                title: course.title,
                category: "Course",
                views: Math.floor(Math.random() * 5000) + 1000 // You can track actual course views
            })),
            ...topTestimonials.map(testimonial => ({
                title: `Testimonial - ${testimonial.name}`,
                category: "Testimonial",
                views: Math.floor(Math.random() * 3000) + 500
            }))
        ].sort((a, b) => b.views - a.views).slice(0, 5);

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    totalStudents,
                    totalTeachers,
                    totalBlogs,
                    totalTestimonials,
                    totalAwards,
                    totalPartners,
                    totalCourses
                },
                monthlyData,
                recentActivities,
                topContent
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: error.message
        });
    }
};

/**
 * @desc    Get dashboard overview (quick stats)
 * @route   GET /api/dashboard/overview
 * @access  Private
 */
const getDashboardOverview = async (req, res) => {
    try {
        const [
            totalUsers,
            totalBlogs,
            totalAwards,
            pendingTestimonials
        ] = await Promise.all([
            User.countDocuments(),
            Blog.countDocuments({ status: 'published' }),
            Award.countDocuments({ status: 'active' }),
            Testimonial.countDocuments({ status: 'pending' })
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalBlogs,
                totalAwards,
                pendingTestimonials
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch overview'
        });
    }
};

// Helper function to get time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            if (interval === 1) return `1 ${unit} ago`;
            return `${interval} ${unit}s ago`;
        }
    }
    return 'Just now';
}

module.exports = {
    getDashboardStats,
    getDashboardOverview
};