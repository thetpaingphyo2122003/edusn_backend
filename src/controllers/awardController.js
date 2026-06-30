// src/controllers/awardController.js
const awardRepository = require('../repositories/awardRepository');
const AwardSettings = require('../models/AwardSettings');
const NotificationService = require('../services/notificationService');

const isTeacherAwardCategory = (category = '') =>
    category.replace(/['’]/g, '').toLowerCase().includes('favorite teacher');

const resolveAwardType = (body = {}) => {
    if (body.award_type === 'teacher' || body.award_type === 'student') {
        return body.award_type;
    }
    if (isTeacherAwardCategory(body.award_category || '')) {
        return 'teacher';
    }
    if (body.teacher_name && !body.student_name) {
        return 'teacher';
    }
    return 'student';
};

const validateAwardPayload = (body, { isUpdate = false } = {}) => {
    const errors = [];
    const awardType = resolveAwardType(body);

    if (!body.academic_year?.trim()) {
        errors.push('Academic year is required');
    } else if (!/^\d{4}-\d{4}$/.test(body.academic_year.trim())) {
        errors.push('Academic year must use format YYYY-YYYY (e.g. 2024-2025)');
    }

    if (!body.award_category?.trim()) {
        errors.push('Award category is required');
    }

    if (awardType === 'teacher') {
        if (!body.teacher_name?.trim()) {
            errors.push('Teacher name is required for teacher award');
        }
        if (!body.subject?.trim()) {
            errors.push('Subject is required for teacher award');
        }
    } else {
        if (!body.student_name?.trim()) {
            errors.push('Student name is required for student award');
        }
        if (!body.grade_year?.trim()) {
            errors.push('Grade/Year is required for student award');
        }
    }

    if (body.display_order !== undefined && body.display_order !== null && body.display_order !== '') {
        const order = Number(body.display_order);
        if (Number.isNaN(order) || order < 0 || order > 999) {
            errors.push('Display order must be between 0 and 999');
        }
    }

    return { errors, awardType };
};

const normalizeAwardFields = (body, awardType) => {
    const normalized = {
        academic_year: body.academic_year?.trim(),
        campus: body.campus?.trim() || null,
        award_category: body.award_category?.trim() || null,
        sub_category: body.sub_category?.trim() || null,
        award_title: body.award_title?.trim() || null,
        display_order: body.display_order !== undefined && body.display_order !== null && body.display_order !== ''
            ? Number(body.display_order)
            : 0,
    };

    if (awardType === 'teacher') {
        normalized.student_name = null;
        normalized.grade_year = null;
        normalized.teacher_name = body.teacher_name?.trim() || null;
        normalized.subject = body.subject?.trim() || null;
    } else {
        normalized.teacher_name = null;
        normalized.subject = null;
        normalized.student_name = body.student_name?.trim() || null;
        normalized.grade_year = body.grade_year?.trim() || null;
    }

    return normalized;
};

/**
 * @desc    Get all awards (PUBLIC - active only)
 * @route   GET /api/awards
 * @access  Public
 */
const getAllAwards = async (req, res, next) => {
    try {
        const { year, campus } = req.query;
        let awards;
        
        if (year && campus) {
            awards = await awardRepository.findByCampus(campus, year);
        } else if (year) {
            awards = await awardRepository.findByAcademicYear(year);
        } else if (campus) {
            awards = await awardRepository.findByCampus(campus);
        } else {
            awards = await awardRepository.findAll({ status: 'active' }, { sort: { academic_year: -1, display_order: 1 } });
        }
        
        res.json({
            success: true,
            count: awards.length,
            data: awards
        });
    } catch (error) {
        next(error);
    }
};

const sortYearsDesc = (years) =>
    [...new Set(years.filter(Boolean))].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

const getAvailableYears = async (req, res, next) => {
    try {
        const [awardYears, settings] = await Promise.all([
            awardRepository.getAvailableYears(true),
            AwardSettings.findOne().lean(),
        ]);
        const years = sortYearsDesc([
            ...awardYears,
            settings?.default_academic_year,
        ]);
        res.json({
            success: true,
            data: years,
        });
    } catch (error) {
        next(error);
    }
};

const getAdminAvailableYears = async (req, res, next) => {
    try {
        const [awardYears, settings] = await Promise.all([
            awardRepository.getAvailableYears(false),
            AwardSettings.findOne().lean(),
        ]);
        const years = sortYearsDesc([
            ...awardYears,
            settings?.default_academic_year,
        ]);
        res.json({
            success: true,
            data: years,
        });
    } catch (error) {
        next(error);
    }
};

const getAwardPageSettings = async (req, res, next) => {
    try {
        let settings = await AwardSettings.findOne();
        if (!settings) {
            settings = await AwardSettings.create({});
        }
        res.json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
};

const updateAwardPageSettings = async (req, res, next) => {
    try {
        let settings = await AwardSettings.findOne();
        const payload = {
            breadcrumb_title: req.body.breadcrumb_title,
            default_academic_year: req.body.default_academic_year,
            page_intro: req.body.page_intro,
            category_sections: req.body.category_sections,
        };

        if (settings) {
            settings = await AwardSettings.findByIdAndUpdate(settings._id, payload, { new: true });
        } else {
            settings = await AwardSettings.create(payload);
        }

        res.json({
            success: true,
            message: 'Award page settings updated',
            data: settings,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get ALL awards for admin (including inactive)
 * @route   GET /api/awards/admin/all
 * @access  Private (Admin only)
 */
const getAllAwardsAdmin = async (req, res, next) => {
    try {
        const { year, campus, status, award_category } = req.query;
        let filter = {};
        
        if (year) filter.academic_year = year;
        if (campus) filter.campus = campus;
        if (status) filter.status = status;
        if (award_category) filter.award_category = award_category;
        
        const awards = await awardRepository.findAllForAdmin(filter);
        
        res.json({
            success: true,
            count: awards.length,
            data: awards
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single award by id
 * @route   GET /api/awards/:id
 * @access  Public
 */
const getAwardById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const award = await awardRepository.findById(id);
        
        if (!award) {
            return res.status(404).json({
                success: false,
                message: 'Award not found'
            });
        }
        
        res.json({
            success: true,
            data: award
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get awards by academic year
 * @route   GET /api/awards/year/:year
 * @access  Public
 */
const getAwardsByYear = async (req, res, next) => {
    try {
        const { year } = req.params;
        const awards = await awardRepository.findByAcademicYear(year);
        
        res.json({
            success: true,
            count: awards.length,
            data: awards
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get teacher awards (Favorite Teacher Award)
 * @route   GET /api/awards/teacher/:year
 * @access  Public
 */
const getTeacherAwards = async (req, res, next) => {
    try {
        const { year } = req.params;
        const awards = await awardRepository.findTeacherAwards(year);
        
        res.json({
            success: true,
            count: awards.length,
            data: awards
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get student awards
 * @route   GET /api/awards/student/:year
 * @access  Public
 */
const getStudentAwards = async (req, res, next) => {
    try {
        const { year } = req.params;
        const awards = await awardRepository.findStudentAwards(year);
        
        res.json({
            success: true,
            count: awards.length,
            data: awards
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get awards by campus
 * @route   GET /api/awards/campus/:campus
 * @access  Public
 */
const getAwardsByCampus = async (req, res, next) => {
    try {
        const { campus } = req.params;
        const { year } = req.query;
        const awards = await awardRepository.findByCampus(campus, year);
        
        res.json({
            success: true,
            count: awards.length,
            data: awards
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get awards by status (for admin filtering)
 * @route   GET /api/awards/status/:status
 * @access  Private (Admin only)
 */
const getAwardsByStatus = async (req, res, next) => {
    try {
        const { status } = req.params;
        const awards = await awardRepository.findByStatus(status);
        
        res.json({
            success: true,
            count: awards.length,
            data: awards
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get award statistics (counts by category, year, etc.)
 * @route   GET /api/awards/admin/stats
 * @access  Private (Admin only)
 */
const getAwardStats = async (req, res, next) => {
    try {
        const awards = await awardRepository.findAllForAdmin({});
        
        const stats = {
            total: awards.length,
            active: awards.filter(a => a.status === 'active').length,
            inactive: awards.filter(a => a.status === 'inactive').length,
            student: awards.filter(a => a.student_name).length,
            teacher: awards.filter(a => a.teacher_name).length,
            byYear: {},
            byCategory: {}
        };
        
        // Group by academic year
        awards.forEach(award => {
            if (award.academic_year) {
                stats.byYear[award.academic_year] = (stats.byYear[award.academic_year] || 0) + 1;
            }
            if (award.award_category) {
                stats.byCategory[award.award_category] = (stats.byCategory[award.award_category] || 0) + 1;
            }
        });
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new award (Admin only)
 * @route   POST /api/awards
 * @access  Private (Admin)
 */
const createAward = async (req, res, next) => {
    try {
        const { errors, awardType } = validateAwardPayload(req.body);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: errors[0],
                errors,
            });
        }

        const award = await awardRepository.create({
            ...normalizeAwardFields(req.body, awardType),
            status: 'active',
        });
        
        NotificationService.awardCreated(award, req.user._id).catch((err) =>
            console.error('Award notification error:', err)
        );

        res.status(201).json({
            success: true,
            message: 'Award created successfully',
            data: award
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update award (Admin only)
 * @route   PUT /api/awards/:id
 * @access  Private (Admin)
 */
const updateAward = async (req, res, next) => {
    try {
        const { id } = req.params;
        const award = await awardRepository.findById(id);
        
        if (!award) {
            return res.status(404).json({
                success: false,
                message: 'Award not found'
            });
        }

        const mergedBody = {
            academic_year: req.body.academic_year ?? award.academic_year,
            campus: req.body.campus ?? award.campus,
            award_category: req.body.award_category ?? award.award_category,
            sub_category: req.body.sub_category ?? award.sub_category,
            award_title: req.body.award_title ?? award.award_title,
            student_name: req.body.student_name ?? award.student_name,
            grade_year: req.body.grade_year ?? award.grade_year,
            teacher_name: req.body.teacher_name ?? award.teacher_name,
            subject: req.body.subject ?? award.subject,
            display_order: req.body.display_order ?? award.display_order,
            award_type: req.body.award_type,
        };

        const { errors, awardType } = validateAwardPayload(mergedBody, { isUpdate: true });
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: errors[0],
                errors,
            });
        }

        const updatedAward = await awardRepository.updateById(id, {
            ...normalizeAwardFields(mergedBody, awardType),
            status: req.body.status || award.status,
        });
        
        res.json({
            success: true,
            message: 'Award updated successfully',
            data: updatedAward
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete award (Admin only)
 * @route   DELETE /api/awards/:id
 * @access  Private (Admin)
 */
const deleteAward = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const award = await awardRepository.findById(id);
        
        if (!award) {
            return res.status(404).json({
                success: false,
                message: 'Award not found'
            });
        }
        
        await awardRepository.deleteById(id);
        
        res.json({
            success: true,
            message: 'Award deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle award status (active/inactive)
 * @route   PUT /api/awards/:id/toggle-status
 * @access  Private (Admin)
 */
const toggleAwardStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const award = await awardRepository.findById(id);
        
        if (!award) {
            return res.status(404).json({
                success: false,
                message: 'Award not found'
            });
        }
        
        const newStatus = award.status === 'active' ? 'inactive' : 'active';
        const updatedAward = await awardRepository.updateById(id, { status: newStatus });
        
        res.json({
            success: true,
            message: `Award ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: updatedAward
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Bulk create awards (Admin only)
 * @route   POST /api/awards/bulk
 * @access  Private (Admin)
 */
const bulkCreateAwards = async (req, res, next) => {
    try {
        const { awards } = req.body; // Array of award objects
        
        if (!awards || !Array.isArray(awards) || awards.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of awards'
            });
        }
        
        const createdAwards = await awardRepository.model.insertMany(awards);
        
        res.status(201).json({
            success: true,
            message: `${createdAwards.length} awards created successfully`,
            data: createdAwards
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete multiple awards (Admin only)
 * @route   DELETE /api/awards/bulk/delete
 * @access  Private (Admin)
 */
const bulkDeleteAwards = async (req, res, next) => {
    try {
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of award IDs'
            });
        }
        
        const result = await awardRepository.model.deleteMany({ _id: { $in: ids } });
        
        res.json({
            success: true,
            message: `${result.deletedCount} awards deleted successfully`,
            data: { deletedCount: result.deletedCount }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update display order for multiple awards
 * @route   PUT /api/awards/reorder
 * @access  Private (Admin)
 */
const reorderAwards = async (req, res, next) => {
    try {
        const { awards } = req.body; // Array of { id, display_order }
        
        if (!awards || !Array.isArray(awards)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of awards with display_order'
            });
        }
        
        const updatePromises = awards.map(award => 
            awardRepository.updateById(award.id, { display_order: award.display_order })
        );
        
        await Promise.all(updatePromises);
        
        res.json({
            success: true,
            message: 'Awards reordered successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Export all functions
module.exports = {
    getAllAwards,
    getAllAwardsAdmin,
    getAvailableYears,
    getAdminAvailableYears,
    getAwardPageSettings,
    updateAwardPageSettings,
    getAwardById,
    getAwardsByYear,
    getTeacherAwards,
    getStudentAwards,
    getAwardsByCampus,
    getAwardsByStatus,
    getAwardStats,
    createAward,
    updateAward,
    deleteAward,
    toggleAwardStatus,
    bulkCreateAwards,
    bulkDeleteAwards,
    reorderAwards
};