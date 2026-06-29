// src/controllers/awardController.js
const awardRepository = require('../repositories/awardRepository');
const AwardSettings = require('../models/AwardSettings');
const NotificationService = require('../services/notificationService');

const isTeacherAwardCategory = (category = '') =>
    category.replace(/['’]/g, '').toLowerCase().includes('favorite teacher');

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
        const { 
            academic_year, 
            campus, 
            award_category, 
            sub_category, 
            award_title, 
            student_name, 
            grade_year, 
            teacher_name, 
            subject, 
            display_order 
        } = req.body;
        
        // Validate required fields
        if (!academic_year) {
            return res.status(400).json({
                success: false,
                message: 'Academic year is required'
            });
        }
        
        if (!award_category) {
            return res.status(400).json({
                success: false,
                message: 'Award category is required'
            });
        }
        
        // Validate based on award type
        if (isTeacherAwardCategory(award_category)) {
            if (!teacher_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Teacher name is required for teacher award'
                });
            }
        } else {
            if (!student_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Student name is required for student award'
                });
            }
            if (!grade_year) {
                return res.status(400).json({
                    success: false,
                    message: 'Grade/Year is required for student award'
                });
            }
        }
        
        const award = await awardRepository.create({
            academic_year,
            campus: campus || null,
            award_category: award_category || null,
            sub_category: sub_category || null,
            award_title: award_title || null,
            student_name: student_name || null,
            grade_year: grade_year || null,
            teacher_name: teacher_name || null,
            subject: subject || null,
            display_order: display_order || 0,
            status: 'active'
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
        const { 
            academic_year, 
            campus, 
            award_category, 
            sub_category, 
            award_title, 
            student_name, 
            grade_year, 
            teacher_name, 
            subject, 
            display_order, 
            status 
        } = req.body;
        
        const award = await awardRepository.findById(id);
        
        if (!award) {
            return res.status(404).json({
                success: false,
                message: 'Award not found'
            });
        }
        
        const updatedAward = await awardRepository.updateById(id, {
            academic_year: academic_year || award.academic_year,
            campus: campus !== undefined ? campus : award.campus,
            award_category: award_category !== undefined ? award_category : award.award_category,
            sub_category: sub_category !== undefined ? sub_category : award.sub_category,
            award_title: award_title !== undefined ? award_title : award.award_title,
            student_name: student_name !== undefined ? student_name : award.student_name,
            grade_year: grade_year !== undefined ? grade_year : award.grade_year,
            teacher_name: teacher_name !== undefined ? teacher_name : award.teacher_name,
            subject: subject !== undefined ? subject : award.subject,
            display_order: display_order !== undefined ? display_order : award.display_order,
            status: status || award.status
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