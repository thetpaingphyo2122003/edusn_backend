// src/controllers/testimonialController.js
const testimonialRepository = require('../repositories/testimonialRepository');
const { uploadImage, deleteImage } = require('../services/uploadService');

/**
 * @desc    Get all approved testimonials (for public)
 * @route   GET /api/testimonials
 * @access  Public
 */
const getAllTestimonials = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const testimonials = await testimonialRepository.findApproved(limit);
        
        res.json({
            success: true,
            count: testimonials.length,
            data: testimonials
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get ALL testimonials for ADMIN (approved, pending, rejected)
 * @route   GET /api/testimonials/admin/all
 * @access  Private (Admin)
 */
const getAllTestimonialsAdmin = async (req, res, next) => {
    try {
        const testimonials = await testimonialRepository.findAll({});
        
        res.json({
            success: true,
            count: testimonials.length,
            data: testimonials
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single testimonial by id
 * @route   GET /api/testimonials/:id
 * @access  Public
 */
const getTestimonialById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const testimonial = await testimonialRepository.findById(id);
        
        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found'
            });
        }
        
        res.json({
            success: true,
            data: testimonial
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new testimonial (Public)
 * @route   POST /api/testimonials
 * @access  Public
 */
const createTestimonial = async (req, res, next) => {
    try {
        let photo = null;
        
        if (req.file) {
            const uploaded = await uploadImage(req.file, 'testimonials');
            photo = uploaded.url;
        }
        
        const testimonial = await testimonialRepository.create({
            name: req.body.name,
            role: req.body.role || 'Student',
            message: req.body.message,
            rating: req.body.rating || 5,
            photo: photo,
            status: 'pending',
            display_order: req.body.display_order || 0
        });
        
        res.status(201).json({
            success: true,
            message: 'Testimonial submitted successfully. Awaiting approval.',
            data: testimonial
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update testimonial (Admin only)
 * @route   PUT /api/testimonials/:id
 * @access  Private (Admin)
 */
const updateTestimonial = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existing = await testimonialRepository.findById(id);
        
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found'
            });
        }
        
        let photo = existing.photo;
        
        if (req.file) {
            if (existing.photo) {
                const publicId = existing.photo.split('/').pop().split('.')[0];
                await deleteImage(`testimonials/${publicId}`);
            }
            const uploaded = await uploadImage(req.file, 'testimonials');
            photo = uploaded.url;
        }
        
        const updated = await testimonialRepository.updateById(id, {
            name: req.body.name || existing.name,
            role: req.body.role || existing.role,
            message: req.body.message || existing.message,
            rating: req.body.rating || existing.rating,
            photo: photo,
            display_order: req.body.display_order !== undefined ? req.body.display_order : existing.display_order,
            status: req.body.status || existing.status
        });
        
        res.json({
            success: true,
            message: 'Testimonial updated successfully',
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete testimonial (Admin only)
 * @route   DELETE /api/testimonials/:id
 * @access  Private (Admin)
 */
const deleteTestimonial = async (req, res, next) => {
    try {
        const { id } = req.params;
        const testimonial = await testimonialRepository.findById(id);
        
        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found'
            });
        }
        
        if (testimonial.photo) {
            const publicId = testimonial.photo.split('/').pop().split('.')[0];
            await deleteImage(`testimonials/${publicId}`);
        }
        
        await testimonialRepository.deleteById(id);
        
        res.json({
            success: true,
            message: 'Testimonial deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Approve testimonial (Admin only)
 * @route   PUT /api/testimonials/:id/approve
 * @access  Private (Admin)
 */
const approveTestimonial = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const testimonial = await testimonialRepository.findById(id);
        
        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found'
            });
        }
        
        const approved = await testimonialRepository.approve(id);
        
        res.json({
            success: true,
            message: 'Testimonial approved successfully',
            data: approved
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reject testimonial (Admin only)
 * @route   PUT /api/testimonials/:id/reject
 * @access  Private (Admin)
 */
const rejectTestimonial = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const testimonial = await testimonialRepository.findById(id);
        
        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found'
            });
        }
        
        const rejected = await testimonialRepository.reject(id);
        
        res.json({
            success: true,
            message: 'Testimonial rejected successfully',
            data: rejected
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get pending testimonials (Admin only)
 * @route   GET /api/testimonials/admin/pending
 * @access  Private (Admin)
 */
const getPendingTestimonials = async (req, res, next) => {
    try {
        const testimonials = await testimonialRepository.findPending();
        
        res.json({
            success: true,
            count: testimonials.length,
            data: testimonials
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get testimonials by role
 * @route   GET /api/testimonials/role/:role
 * @access  Public
 */
const getTestimonialsByRole = async (req, res, next) => {
    try {
        const { role } = req.params;
        const testimonials = await testimonialRepository.findByRole(role);
        
        res.json({
            success: true,
            count: testimonials.length,
            data: testimonials
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get testimonials statistics (Admin only)
 * @route   GET /api/testimonials/admin/stats
 * @access  Private (Admin)
 */
const getTestimonialStats = async (req, res, next) => {
    try {
        const stats = await testimonialRepository.countByStatus();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

// ✅ Make sure ALL functions are exported
module.exports = {
    getAllTestimonials,
    getAllTestimonialsAdmin,
    getTestimonialById,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    approveTestimonial,
    rejectTestimonial,
    getPendingTestimonials,
    getTestimonialsByRole,
    getTestimonialStats
};