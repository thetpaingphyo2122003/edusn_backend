// src/controllers/subjectController.js
const subjectRepository = require('../repositories/subjectRepository');
const SubjectSettings = require('../models/SubjectSettings');
const NotificationService = require('../services/notificationService');

/**
 * @desc    Get all subjects (with filter by category)
 * @route   GET /api/subjects
 * @access  Public
 */
const getAllSubjects = async (req, res, next) => {
    try {
        const { category } = req.query;
        let subjects;
        
        if (category) {
            subjects = await subjectRepository.findByCategory(category);
        } else {
            subjects = await subjectRepository.findAll({ status: 'active' });
        }
        
        res.json({
            success: true,
            count: subjects.length,
            data: subjects
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single subject by id
 * @route   GET /api/subjects/:id
 * @access  Public
 */
const getSubjectById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const subject = await subjectRepository.findById(id);
        
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        
        res.json({
            success: true,
            data: subject
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get Key Stage 1 subjects
 * @route   GET /api/subjects/key-stage-1
 * @access  Public
 */
const getKeyStage1 = async (req, res, next) => {
    try {
        const subjects = await subjectRepository.findKeyStage1();
        
        res.json({
            success: true,
            count: subjects.length,
            data: subjects
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get Key Stage 2 subjects
 * @route   GET /api/subjects/key-stage-2
 * @access  Public
 */
const getKeyStage2 = async (req, res, next) => {
    try {
        const subjects = await subjectRepository.findKeyStage2();
        
        res.json({
            success: true,
            count: subjects.length,
            data: subjects
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get subjects by specific category
 * @route   GET /api/subjects/category/:category
 * @access  Public
 */
const getSubjectsByCategory = async (req, res, next) => {
    try {
        const { category } = req.params;
        const subjects = await subjectRepository.findByCategory(category);
        
        res.json({
            success: true,
            count: subjects.length,
            data: subjects
        });
    } catch (error) {
        next(error);
    }
};

// Add this to the top of subjectController.js
const { uploadImage, deleteImage } = require('../services/uploadService');

// Update createSubject function:
const createSubject = async (req, res, next) => {
    try {
        let image = null;
        
        // Upload image if exists
        if (req.file) {
            const uploaded = await uploadImage(req.file, 'subjects');
            image = uploaded.url;
        }
        
        const subject = await subjectRepository.create({
            category: req.body.category,
            year: req.body.year || null,
            title: req.body.title,
            age_range: req.body.age_range || null,
            description: req.body.description || null,
            content: req.body.content || null,
            image: image,
            subject_group: req.body.subject_group || null,
            list_column: req.body.list_column ? parseInt(req.body.list_column, 10) : null,
            display_order: parseInt(req.body.display_order) || 0,
            status: req.body.status || 'active'
        });
        
        NotificationService.subjectCreated(subject, req.user._id).catch((err) =>
            console.error('Subject notification error:', err)
        );

        res.status(201).json({
            success: true,
            message: 'Subject created successfully',
            data: subject
        });
    } catch (error) {
        next(error);
    }
};

// Update updateSubject function:
const updateSubject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existingSubject = await subjectRepository.findById(id);
        
        if (!existingSubject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        
        let image = existingSubject.image;
        
        // Upload new image if exists
        if (req.file) {
            if (existingSubject.image) {
                const publicId = existingSubject.image.split('/').pop().split('.')[0];
                await deleteImage(`subjects/${publicId}`);
            }
            const uploaded = await uploadImage(req.file, 'subjects');
            image = uploaded.url;
        }
        
        const updatedSubject = await subjectRepository.updateById(id, {
            category: req.body.category || existingSubject.category,
            year: req.body.year !== undefined ? (req.body.year || null) : existingSubject.year,
            title: req.body.title || existingSubject.title,
            age_range: req.body.age_range !== undefined ? req.body.age_range : existingSubject.age_range,
            description: req.body.description !== undefined ? req.body.description : existingSubject.description,
            content: req.body.content !== undefined ? req.body.content : existingSubject.content,
            image: image,
            subject_group: req.body.subject_group !== undefined ? (req.body.subject_group || null) : existingSubject.subject_group,
            list_column: req.body.list_column !== undefined
                ? (req.body.list_column ? parseInt(req.body.list_column, 10) : null)
                : existingSubject.list_column,
            display_order: req.body.display_order !== undefined ? parseInt(req.body.display_order) : existingSubject.display_order,
            status: req.body.status || existingSubject.status
        });
        
        res.json({
            success: true,
            message: 'Subject updated successfully',
            data: updatedSubject
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete subject (Admin only)
 * @route   DELETE /api/subjects/:id
 * @access  Private (Admin)
 */
const deleteSubject = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const subject = await subjectRepository.findById(id);
        
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        
        await subjectRepository.deleteById(id);
        
        res.json({
            success: true,
            message: 'Subject deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle subject status (active/inactive)
 * @route   PUT /api/subjects/:id/toggle-status
 * @access  Private (Admin)
 */
const toggleSubjectStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const subject = await subjectRepository.findById(id);
        
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }
        
        const newStatus = subject.status === 'active' ? 'inactive' : 'active';
        const updatedSubject = await subjectRepository.updateById(id, { status: newStatus });
        
        res.json({
            success: true,
            message: `Subject ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: updatedSubject
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reorder subjects (update display_order)
 * @route   PUT /api/subjects/reorder
 * @access  Private (Admin)
 */
const reorderSubjects = async (req, res, next) => {
    try {
        const { subjects } = req.body; // [{ id, display_order }]
        
        const updatePromises = subjects.map(subject => 
            subjectRepository.updateById(subject.id, { display_order: subject.display_order })
        );
        
        await Promise.all(updatePromises);
        
        res.json({
            success: true,
            message: 'Subjects reordered successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all subjects for admin (including inactive)
 * @route   GET /api/subjects/admin/all
 * @access  Private (Admin)
 */
const getAllSubjectsAdmin = async (req, res, next) => {
    try {
        const { category, status, search } = req.query;
        const filter = {};

        if (category && category !== 'all') filter.category = category;
        if (status && status !== 'all') filter.status = status;

        let subjects;
        if (search) {
            subjects = await subjectRepository.model.find({
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                ],
                ...filter,
            }).sort({ display_order: 1, createdAt: -1 });
        } else {
            subjects = await subjectRepository.findAllForAdmin(filter);
        }

        res.json({
            success: true,
            count: subjects.length,
            data: subjects,
        });
    } catch (error) {
        next(error);
    }
};

const getSubjectPageSettings = async (req, res, next) => {
    try {
        let settings = await SubjectSettings.findOne();
        if (!settings) {
            settings = await SubjectSettings.create({});
        }
        res.json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
};

const updateSubjectPageSettings = async (req, res, next) => {
    try {
        let settings = await SubjectSettings.findOne();
        const payload = {
            key_stage_1: req.body.key_stage_1,
            key_stage_2: req.body.key_stage_2,
            lower_secondary: req.body.lower_secondary,
            upper_secondary: req.body.upper_secondary,
        };

        if (settings) {
            settings = await SubjectSettings.findByIdAndUpdate(settings._id, payload, { new: true });
        } else {
            settings = await SubjectSettings.create(payload);
        }

        res.json({
            success: true,
            message: 'Subject page settings updated',
            data: settings,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllSubjects,
    getAllSubjectsAdmin,
    getSubjectById,
    getKeyStage1,
    getKeyStage2,
    getSubjectsByCategory,
    createSubject,
    updateSubject,
    deleteSubject,
    toggleSubjectStatus,
    reorderSubjects,
    getSubjectPageSettings,
    updateSubjectPageSettings,
};