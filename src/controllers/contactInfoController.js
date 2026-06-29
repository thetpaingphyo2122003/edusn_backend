// src/controllers/contactInfoController.js
const contactInfoRepository = require('../repositories/contactInfoRepository');

/**
 * @desc    Get all contact info (campuses and offices) - FOR ADMIN
 * @route   GET /api/contact
 * @access  Private (Admin)
 */
const getAllContactInfo = async (req, res, next) => {
    try {
        // ✅ Use methods that return ALL contacts (no status filter)
        const [campuses, offices] = await Promise.all([
            contactInfoRepository.findAllCampuses(),  // Now returns all campuses
            contactInfoRepository.findAllOffices()    // Now returns all offices
        ]);
        
        res.json({
            success: true,
            data: {
                campuses,
                offices
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all active campuses (for public)
 * @route   GET /api/contact/campuses
 * @access  Public
 */
const getCampuses = async (req, res, next) => {
    try {
        const campuses = await contactInfoRepository.findActiveCampuses();
        
        res.json({
            success: true,
            count: campuses.length,
            data: campuses
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all active offices (for public)
 * @route   GET /api/contact/offices
 * @access  Public
 */
const getOffices = async (req, res, next) => {
    try {
        const offices = await contactInfoRepository.findActiveOffices();
        
        res.json({
            success: true,
            count: offices.length,
            data: offices
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get contact by name
 * @route   GET /api/contact/name/:name
 * @access  Public
 */
const getContactByName = async (req, res, next) => {
    try {
        const { name } = req.params;
        const contact = await contactInfoRepository.findByName(name);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact information not found'
            });
        }
        
        res.json({
            success: true,
            data: contact
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single contact info by id
 * @route   GET /api/contact/:id
 * @access  Private (Admin)
 */
const getContactById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const contact = await contactInfoRepository.findById(id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact information not found'
            });
        }
        
        res.json({
            success: true,
            data: contact
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new contact info (Admin only)
 * @route   POST /api/contact
 * @access  Private (Admin)
 */
const createContact = async (req, res, next) => {
    try {
        const { type, name, sub_title, address, emails, phones, display_order, extra_data } = req.body;
        
        const contact = await contactInfoRepository.create({
            type,
            name,
            sub_title: sub_title || null,
            address: address || null,
            emails: emails || { general: null, office: null, support: null, admissions: null },
            phones: phones || { main: null, hotline: null, emergency: null },
            display_order: display_order || 0,
            extra_data: extra_data || {},
            status: 'active'
        });
        
        res.status(201).json({
            success: true,
            message: 'Contact information created successfully',
            data: contact
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update contact info (Admin only)
 * @route   PUT /api/contact/:id
 * @access  Private (Admin)
 */
const updateContact = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { type, name, sub_title, address, emails, phones, display_order, status, extra_data } = req.body;
        
        const contact = await contactInfoRepository.findById(id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact information not found'
            });
        }
        
        const updatedContact = await contactInfoRepository.updateById(id, {
            type: type || contact.type,
            name: name || contact.name,
            sub_title: sub_title !== undefined ? sub_title : contact.sub_title,
            address: address !== undefined ? address : contact.address,
            emails: emails || contact.emails,
            phones: phones || contact.phones,
            display_order: display_order !== undefined ? display_order : contact.display_order,
            extra_data: extra_data !== undefined ? extra_data : (contact.extra_data || {}),
            status: status || contact.status
        });
        
        res.json({
            success: true,
            message: 'Contact information updated successfully',
            data: updatedContact
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete contact info (Admin only)
 * @route   DELETE /api/contact/:id
 * @access  Private (Admin)
 */
const deleteContact = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const contact = await contactInfoRepository.findById(id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact information not found'
            });
        }
        
        await contactInfoRepository.deleteById(id);
        
        res.json({
            success: true,
            message: 'Contact information deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle contact status (active/inactive)
 * @route   PUT /api/contact/:id/toggle-status
 * @access  Private (Admin)
 */
const toggleContactStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const contact = await contactInfoRepository.findById(id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact information not found'
            });
        }
        
        const newStatus = contact.status === 'active' ? 'inactive' : 'active';
        const updatedContact = await contactInfoRepository.updateById(id, { status: newStatus });
        
        res.json({
            success: true,
            message: `Contact information ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: updatedContact
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reorder contact info
 * @route   PUT /api/contact/reorder
 * @access  Private (Admin)
 */
const reorderContact = async (req, res, next) => {
    try {
        const { contacts } = req.body; // [{ id, display_order }]
        
        const updatePromises = contacts.map(contact => 
            contactInfoRepository.updateById(contact.id, { display_order: contact.display_order })
        );
        
        await Promise.all(updatePromises);
        
        res.json({
            success: true,
            message: 'Contact information reordered successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllContactInfo,
    getCampuses,
    getOffices,
    getContactById,
    getContactByName,
    createContact,
    updateContact,
    deleteContact,
    toggleContactStatus,
    reorderContact
};