// src/controllers/tuitionController.js
const tuitionRepository = require('../repositories/tuitionRepository');

/**
 * @desc    Get all tuition fees
 * @route   GET /api/tuition/fees
 * @access  Public
 */
const getAllFees = async (req, res, next) => {
    try {
        const { category } = req.query;
        let fees;
        
        if (category) {
            fees = await tuitionRepository.findByCategory(category);
        } else {
            fees = await tuitionRepository.findFees();
        }
        
        res.json({
            success: true,
            count: fees.length,
            data: fees
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get fees by category
 * @route   GET /api/tuition/fees/category/:category
 * @access  Public
 */
const getFeesByCategory = async (req, res, next) => {
    try {
        const { category } = req.params;
        const fees = await tuitionRepository.findByCategory(category);
        
        res.json({
            success: true,
            count: fees.length,
            data: fees
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single tuition fee by id
 * @route   GET /api/tuition/fees/:id
 * @access  Public
 */
const getFeeById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const fee = await tuitionRepository.findById(id);
        
        if (!fee) {
            return res.status(404).json({
                success: false,
                message: 'Tuition fee not found'
            });
        }
        
        res.json({
            success: true,
            data: fee
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get payment information (bank accounts)
 * @route   GET /api/tuition/payment-info
 * @access  Public
 */
const getPaymentInfo = async (req, res, next) => {
    try {
        const paymentInfo = await tuitionRepository.getPaymentInfo();
        
        res.json({
            success: true,
            data: paymentInfo
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get virtual attendance page content
 * @route   GET /api/tuition/virtual-attendance
 * @access  Public
 */
const getVirtualAttendance = async (req, res, next) => {
    try {
        const virtualAttendance = await tuitionRepository.getVirtualAttendance();
        
        res.json({
            success: true,
            data: virtualAttendance
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get tuition page info
 * @route   GET /api/tuition/page-info
 * @access  Public
 */
const getTuitionPageInfo = async (req, res, next) => {
    try {
        const pageInfo = await tuitionRepository.getPageInfo();
        
        res.json({
            success: true,
            data: pageInfo
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new tuition fee (Admin only)
 * @route   POST /api/tuition/fees
 * @access  Private (Admin)
 */
const createFee = async (req, res, next) => {
    try {
        const { category, program_name, year_level, total_fees_mmk, material_fees_mmk, microsoft_fees_mmk, installments, installment_note, scholarship_note, display_order } = req.body;
        
        const fee = await tuitionRepository.create({
            type: 'fee',
            category,
            program_name: program_name || null,
            year_level: year_level || null,
            total_fees_mmk,
            material_fees_mmk: material_fees_mmk || 0,
            microsoft_fees_mmk: microsoft_fees_mmk || 0,
            installments: installments || [],
            installment_note: installment_note || null,
            scholarship_note: scholarship_note || null,
            display_order: display_order || 0,
            status: 'active'
        });
        
        res.status(201).json({
            success: true,
            message: 'Tuition fee created successfully',
            data: fee
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update tuition fee (Admin only)
 * @route   PUT /api/tuition/fees/:id
 * @access  Private (Admin)
 */
const updateFee = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { category, program_name, year_level, total_fees_mmk, material_fees_mmk, microsoft_fees_mmk, installments, installment_note, scholarship_note, display_order, status } = req.body;
        
        const fee = await tuitionRepository.findById(id);
        
        if (!fee) {
            return res.status(404).json({
                success: false,
                message: 'Tuition fee not found'
            });
        }
        
        const updatedFee = await tuitionRepository.updateById(id, {
            category: category || fee.category,
            program_name: program_name !== undefined ? program_name : fee.program_name,
            year_level: year_level !== undefined ? year_level : fee.year_level,
            total_fees_mmk: total_fees_mmk || fee.total_fees_mmk,
            material_fees_mmk: material_fees_mmk !== undefined ? material_fees_mmk : fee.material_fees_mmk,
            microsoft_fees_mmk: microsoft_fees_mmk !== undefined ? microsoft_fees_mmk : fee.microsoft_fees_mmk,
            installments: installments || fee.installments,
            installment_note: installment_note !== undefined ? installment_note : fee.installment_note,
            scholarship_note: scholarship_note !== undefined ? scholarship_note : fee.scholarship_note,
            display_order: display_order !== undefined ? display_order : fee.display_order,
            status: status || fee.status
        });
        
        res.json({
            success: true,
            message: 'Tuition fee updated successfully',
            data: updatedFee
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete tuition fee (Admin only)
 * @route   DELETE /api/tuition/fees/:id
 * @access  Private (Admin)
 */
const deleteFee = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const fee = await tuitionRepository.findById(id);
        
        if (!fee) {
            return res.status(404).json({
                success: false,
                message: 'Tuition fee not found'
            });
        }
        
        await tuitionRepository.deleteById(id);
        
        res.json({
            success: true,
            message: 'Tuition fee deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update payment information (Admin only)
 * @route   PUT /api/tuition/payment-info
 * @access  Private (Admin)
 */
const updatePaymentInfo = async (req, res, next) => {
    try {
        const { bank_accounts } = req.body;
        
        let paymentInfo = await tuitionRepository.getPaymentInfo();
        
        if (paymentInfo) {
            paymentInfo = await tuitionRepository.updateById(paymentInfo._id, {
                bank_accounts
            });
        } else {
            paymentInfo = await tuitionRepository.create({
                type: 'payment_info',
                bank_accounts
            });
        }
        
        res.json({
            success: true,
            message: 'Payment information updated successfully',
            data: paymentInfo
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update virtual attendance page (Admin only)
 * @route   PUT /api/tuition/virtual-attendance
 * @access  Private (Admin)
 */
const updateVirtualAttendance = async (req, res, next) => {
    try {
        const { title, content, emails, phones } = req.body;
        
        let virtualAttendance = await tuitionRepository.getVirtualAttendance();
        
        if (virtualAttendance) {
            virtualAttendance = await tuitionRepository.updateById(virtualAttendance._id, {
                title,
                content,
                emails,
                phones
            });
        } else {
            virtualAttendance = await tuitionRepository.create({
                type: 'virtual_attendance',
                title,
                content,
                emails,
                phones
            });
        }
        
        res.json({
            success: true,
            message: 'Virtual attendance page updated successfully',
            data: virtualAttendance
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update tuition page info (Admin only)
 * @route   PUT /api/tuition/page-info
 * @access  Private (Admin)
 */
const updateTuitionPageInfo = async (req, res, next) => {
    try {
        const { title, content } = req.body;
        
        let pageInfo = await tuitionRepository.getPageInfo();
        
        if (pageInfo) {
            pageInfo = await tuitionRepository.updateById(pageInfo._id, {
                title,
                content
            });
        } else {
            pageInfo = await tuitionRepository.create({
                type: 'page_info',
                title,
                content
            });
        }
        
        res.json({
            success: true,
            message: 'Tuition page info updated successfully',
            data: pageInfo
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle fee status (active/inactive)
 * @route   PUT /api/tuition/fees/:id/toggle-status
 * @access  Private (Admin)
 */
const toggleFeeStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const fee = await tuitionRepository.findById(id);
        
        if (!fee) {
            return res.status(404).json({
                success: false,
                message: 'Tuition fee not found'
            });
        }
        
        const newStatus = fee.status === 'active' ? 'inactive' : 'active';
        const updatedFee = await tuitionRepository.updateById(id, { status: newStatus });
        
        res.json({
            success: true,
            message: `Tuition fee ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: updatedFee
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllFees,
    getFeesByCategory,
    getFeeById,
    getPaymentInfo,
    getVirtualAttendance,
    getTuitionPageInfo,
    createFee,
    updateFee,
    deleteFee,
    updatePaymentInfo,
    updateVirtualAttendance,
    updateTuitionPageInfo,
    toggleFeeStatus
};