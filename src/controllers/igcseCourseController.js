const igcseCourseRepository = require('../repositories/igcseCourseRepository');
const IgcseCourseSettings = require('../models/IgcseCourseSettings');
const { uploadImage, deleteImage } = require('../services/uploadService');
const NotificationService = require('../services/notificationService');

// Helper function to extract public ID from Cloudinary URL
const extractPublicId = (url) => {
    if (!url || !url.includes('cloudinary.com')) return null;
    try {
        const parts = url.split('/');
        const versionIndex = parts.findIndex(part => part.startsWith('v'));
        if (versionIndex !== -1 && versionIndex + 1 < parts.length) {
            const publicIdWithExt = parts.slice(versionIndex + 1).join('/');
            return publicIdWithExt.split('.')[0];
        }
        return null;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};

/**
 * @desc    Get all courses (with filter by category) - Public
 * @route   GET /api/courses
 * @access  Public
 */
const getAllCourses = async (req, res, next) => {
    try {
        const { category } = req.query;
        let courses;
        
        if (category) {
            courses = await igcseCourseRepository.findByCategory(category);
        } else {
            courses = await igcseCourseRepository.findAllCourses({ status: 'active' });
        }
        
        res.json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get ALL courses for admin (including inactive)
 * @route   GET /api/courses/admin/all
 * @access  Private (Admin)
 */
const getAllCoursesAdmin = async (req, res, next) => {
    try {
        const courses = await igcseCourseRepository.findAllCourses({});
        
        res.json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all IGCSE courses
 * @route   GET /api/courses/igcse
 * @access  Public
 */
const getIGCSECourses = async (req, res, next) => {
    try {
        const courses = await igcseCourseRepository.findIGCSE();
        
        res.json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all A Level courses
 * @route   GET /api/courses/a-level
 * @access  Public
 */
const getALevelCourses = async (req, res, next) => {
    try {
        const courses = await igcseCourseRepository.findALevel();
        
        res.json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single course by slug
 * @route   GET /api/courses/:slug
 * @access  Public
 */
const getCourseBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const course = await igcseCourseRepository.findBySlug(slug);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        res.json({
            success: true,
            data: course
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single course by id
 * @route   GET /api/courses/id/:id
 * @access  Public
 */
const getCourseById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await igcseCourseRepository.findById(id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        res.json({
            success: true,
            data: course
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new course (Admin only) - WITH IMAGE UPLOAD
 * @route   POST /api/courses
 * @access  Private (Admin)
 */
const createCourse = async (req, res, next) => {
    try {
        let thumbnail = null;
        let tabs = [];
        
        // Upload thumbnail if exists
        if (req.file) {
            const uploaded = await uploadImage(req.file, 'courses');
            thumbnail = uploaded.url;
        }
        
        // Parse tabs from JSON string
        if (req.body.tabs) {
            try {
                tabs = typeof req.body.tabs === 'string' ? JSON.parse(req.body.tabs) : req.body.tabs;
            } catch (e) {
                tabs = [];
            }
        }
        
        const courseData = {
            category: req.body.category,
            title: req.body.title,
            thumbnail: thumbnail,
            tabs: tabs,
            display_order: parseInt(req.body.display_order) || 0,
            status: req.body.status || 'active'
        };
        
        const course = await igcseCourseRepository.create(courseData);
        
        NotificationService.courseCreated(course, req.user._id).catch((err) =>
            console.error('Course notification error:', err)
        );

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: course
        });
    } catch (error) {
        console.error('Create course error:', error);
        next(error);
    }
};

/**
 * @desc    Update course (Admin only) - WITH IMAGE UPLOAD
 * @route   PUT /api/courses/:id
 * @access  Private (Admin)
 */
const updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existingCourse = await igcseCourseRepository.findById(id);
        
        if (!existingCourse) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        let thumbnail = existingCourse.thumbnail;
        let tabs = existingCourse.tabs;
        
        // Upload new thumbnail if exists
        if (req.file) {
            if (existingCourse.thumbnail) {
                try {
                    const publicId = extractPublicId(existingCourse.thumbnail);
                    if (publicId) await deleteImage(publicId);
                } catch (err) {
                    console.error('Error deleting old thumbnail:', err);
                }
            }
            const uploaded = await uploadImage(req.file, 'courses');
            thumbnail = uploaded.url;
        }
        
        // Parse tabs from JSON string
        if (req.body.tabs) {
            try {
                tabs = typeof req.body.tabs === 'string' ? JSON.parse(req.body.tabs) : req.body.tabs;
            } catch (e) {}
        }
        
        const updateData = {
            category: req.body.category || existingCourse.category,
            title: req.body.title || existingCourse.title,
            thumbnail: thumbnail,
            tabs: tabs,
            display_order: req.body.display_order !== undefined ? parseInt(req.body.display_order) : existingCourse.display_order,
            status: req.body.status || existingCourse.status
        };
        
        const updatedCourse = await igcseCourseRepository.updateById(id, updateData);
        
        res.json({
            success: true,
            message: 'Course updated successfully',
            data: updatedCourse
        });
    } catch (error) {
        console.error('Update course error:', error);
        next(error);
    }
};

/**
 * @desc    Delete course (Admin only)
 * @route   DELETE /api/courses/:id
 * @access  Private (Admin)
 */
const deleteCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await igcseCourseRepository.findById(id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        if (course.thumbnail) {
            try {
                const publicId = extractPublicId(course.thumbnail);
                if (publicId) await deleteImage(publicId);
            } catch (err) {
                console.error('Error deleting thumbnail:', err);
            }
        }
        
        await igcseCourseRepository.deleteById(id);
        
        res.json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        console.error('Delete course error:', error);
        next(error);
    }
};

/**
 * @desc    Update course tabs (Admin only)
 * @route   PUT /api/courses/:id/tabs
 * @access  Private (Admin)
 */
const updateCourseTabs = async (req, res, next) => {
    try {
        const { id } = req.params;
        let { tabs } = req.body;
        
        const course = await igcseCourseRepository.findById(id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        if (typeof tabs === 'string') {
            try {
                tabs = JSON.parse(tabs);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid tabs format'
                });
            }
        }
        
        const updatedCourse = await igcseCourseRepository.updateById(id, { tabs });
        
        res.json({
            success: true,
            message: 'Course tabs updated successfully',
            data: updatedCourse
        });
    } catch (error) {
        console.error('Update course tabs error:', error);
        next(error);
    }
};

/**
 * @desc    Toggle course status (active/inactive)
 * @route   PUT /api/courses/:id/toggle-status
 * @access  Private (Admin)
 */
const toggleCourseStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const course = await igcseCourseRepository.findById(id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        const newStatus = course.status === 'active' ? 'inactive' : 'active';
        const updatedCourse = await igcseCourseRepository.updateById(id, { status: newStatus });
        
        res.json({
            success: true,
            message: `Course ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: updatedCourse
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reorder courses
 * @route   PUT /api/courses/reorder
 * @access  Private (Admin)
 */
const reorderCourses = async (req, res, next) => {
    try {
        const { courses } = req.body;
        
        const updatePromises = courses.map(course => 
            igcseCourseRepository.updateOrder(course.id, course.display_order)
        );
        
        await Promise.all(updatePromises);
        
        res.json({
            success: true,
            message: 'Courses reordered successfully'
        });
    } catch (error) {
        next(error);
    }
};

const getCoursePageSettings = async (req, res, next) => {
    try {
        let settings = await IgcseCourseSettings.findOne();
        if (!settings) {
            settings = await IgcseCourseSettings.create({});
        }
        res.json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
};

const updateCoursePageSettings = async (req, res, next) => {
    try {
        let settings = await IgcseCourseSettings.findOne();
        const payload = {
            parent_breadcrumb_title: req.body.parent_breadcrumb_title,
            parent_breadcrumb_path: req.body.parent_breadcrumb_path,
            show_parent_in_breadcrumb: req.body.show_parent_in_breadcrumb,
        };

        if (settings) {
            settings = await IgcseCourseSettings.findByIdAndUpdate(settings._id, payload, { new: true });
        } else {
            settings = await IgcseCourseSettings.create(payload);
        }

        res.json({
            success: true,
            message: 'Course page settings updated',
            data: settings,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllCourses,
    getAllCoursesAdmin,
    getIGCSECourses,
    getALevelCourses,
    getCourseBySlug,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    updateCourseTabs,
    toggleCourseStatus,
    reorderCourses,
    getCoursePageSettings,
    updateCoursePageSettings,
};