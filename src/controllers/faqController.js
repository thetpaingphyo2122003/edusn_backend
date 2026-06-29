// src/controllers/faqController.js
const faqRepository = require('../repositories/faqRepository');
const NotificationService = require('../services/notificationService');

/**
 * @desc    Get all active FAQs (for public website)
 * @route   GET /api/faqs
 * @access  Public
 */
const getAllFaqs = async (req, res, next) => {
    try {
        const { category } = req.query;
        let faqs;
        
        if (category) {
            faqs = await faqRepository.findByCategory(category);
        } else {
            faqs = await faqRepository.findActiveFaqs();
        }
        
        res.json({
            success: true,
            count: faqs.length,
            data: faqs
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get ALL FAQs (including inactive) - FOR ADMIN
 * @route   GET /api/faqs/admin/all
 * @access  Private (Admin)
 */
const getAllFaqsAdmin = async (req, res, next) => {
    try {
        // Get all FAQs (both active and inactive)
        const faqs = await faqRepository.findAll({ type: 'faq' });
        
        res.json({
            success: true,
            count: faqs.length,
            data: faqs
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single FAQ by id
 * @route   GET /api/faqs/:id
 * @access  Public
 */
const getFaqById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const faq = await faqRepository.findById(id);
        
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }
        
        res.json({
            success: true,
            data: faq
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get FAQs by category
 * @route   GET /api/faqs/category/:category
 * @access  Public
 */
const getFaqsByCategory = async (req, res, next) => {
    try {
        const { category } = req.params;
        const faqs = await faqRepository.findByCategory(category);
        
        res.json({
            success: true,
            count: faqs.length,
            data: faqs
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get FAQ page info
 * @route   GET /api/faqs/page-info
 * @access  Public
 */
const getFaqPageInfo = async (req, res, next) => {
    try {
        const pageInfo = await faqRepository.getPageInfo();
        
        res.json({
            success: true,
            data: pageInfo
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Search FAQs by keyword
 * @route   GET /api/faqs/search/:keyword
 * @access  Public
 */
const searchFaqs = async (req, res, next) => {
    try {
        const { keyword } = req.params;
        const faqs = await faqRepository.search(keyword);
        
        res.json({
            success: true,
            count: faqs.length,
            data: faqs
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new FAQ (Admin only)
 * @route   POST /api/faqs
 * @access  Private (Admin)
 */
const createFaq = async (req, res, next) => {
    try {
        const { category, question, answer, display_order, status, extra_data, type, title, content } = req.body;
        
        const faq = await faqRepository.create({
            type: type || 'faq',
            category: category || 'General',
            question,
            answer,
            title,
            content,
            extra_data: extra_data || null,
            display_order: display_order || 0,
            status: status || 'active'
        });
        
        NotificationService.faqCreated(faq, req.user._id).catch((err) =>
            console.error('FAQ notification error:', err)
        );

        res.status(201).json({
            success: true,
            message: 'FAQ created successfully',
            data: faq
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create/Update FAQ page info (Admin only)
 * @route   POST /api/faqs/page-info
 * @access  Private (Admin)
 */
const updateFaqPageInfo = async (req, res, next) => {
    try {
        const { title, content, extra_data } = req.body;
        
        let pageInfo = await faqRepository.getPageInfo();
        
        if (pageInfo) {
            pageInfo = await faqRepository.updateById(pageInfo._id, {
                title,
                content,
                extra_data: extra_data || null,
            });
        } else {
            pageInfo = await faqRepository.create({
                type: 'page_info',
                title,
                content,
                extra_data: extra_data || null,
                status: 'active'
            });
        }
        
        res.json({
            success: true,
            message: 'FAQ page info updated successfully',
            data: pageInfo
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update FAQ (Admin only)
 * @route   PUT /api/faqs/:id
 * @access  Private (Admin)
 */
const updateFaq = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { category, question, answer, display_order, status, extra_data, title, content, type } = req.body;
        
        const faq = await faqRepository.findById(id);
        
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }
        
        const updatePayload = {
            category: category !== undefined ? category : faq.category,
            question: question !== undefined ? question : faq.question,
            answer: answer !== undefined ? answer : faq.answer,
            display_order: display_order !== undefined ? display_order : faq.display_order,
            status: status !== undefined ? status : faq.status,
        };

        if (title !== undefined) updatePayload.title = title;
        if (content !== undefined) updatePayload.content = content;
        if (type !== undefined) updatePayload.type = type;
        if (extra_data !== undefined) updatePayload.extra_data = extra_data;

        const updatedFaq = await faqRepository.updateById(id, updatePayload);
        
        res.json({
            success: true,
            message: 'FAQ updated successfully',
            data: updatedFaq
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete FAQ (Admin only)
 * @route   DELETE /api/faqs/:id
 * @access  Private (Admin)
 */
const deleteFaq = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const faq = await faqRepository.findById(id);
        
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }
        
        await faqRepository.deleteById(id);
        
        res.json({
            success: true,
            message: 'FAQ deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle FAQ status (active/inactive)
 * @route   PUT /api/faqs/:id/toggle-status
 * @access  Private (Admin)
 */
const toggleFaqStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const faq = await faqRepository.findById(id);
        
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }
        
        const newStatus = faq.status === 'active' ? 'inactive' : 'active';
        const updatedFaq = await faqRepository.updateById(id, { status: newStatus });
        
        res.json({
            success: true,
            message: `FAQ ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: updatedFaq
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllFaqs,
    getAllFaqsAdmin,  // ✅ New admin endpoint
    getFaqById,
    getFaqsByCategory,
    getFaqPageInfo,
    searchFaqs,
    createFaq,
    updateFaqPageInfo,
    updateFaq,
    deleteFaq,
    toggleFaqStatus
};