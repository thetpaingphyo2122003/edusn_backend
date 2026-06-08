// src/controllers/partnerController.js
const partnerRepository = require('../repositories/partnerRepository');
const { uploadImage, deleteImage } = require('../services/uploadService');

// ==================== Public Controllers ====================
const getAllPartners = async (req, res, next) => {
    try {
        const partners = await partnerRepository.findAll({ status: 'active' });
        res.json({ success: true, count: partners.length, data: partners });
    } catch (error) { next(error); }
};

const getPartnerById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const partner = await partnerRepository.findById(id);
        if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });
        res.json({ success: true, data: partner });
    } catch (error) { next(error); }
};

const getUniversities = async (req, res, next) => {
    try {
        const universities = await partnerRepository.findUniversities();
        res.json({ success: true, data: universities });
    } catch (error) { next(error); }
};

const getProgressionRoutes = async (req, res, next) => {
    try {
        const routes = await partnerRepository.findProgressionRoutes();
        res.json({ success: true, data: routes });
    } catch (error) { next(error); }
};

const searchProgressionRoutes = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ success: false, message: 'Search keyword required' });
        const routes = await partnerRepository.searchRoutes(q);
        res.json({ success: true, count: routes.length, data: routes });
    } catch (error) { next(error); }
};

// ==================== Admin Controllers ====================
// src/controllers/partnerController.js (partial - add/update these functions)

const createPartner = async (req, res, next) => {
    try {
        let logo_path = null;
        
        if (req.file) {
            const uploaded = await uploadImage(req.file, 'partners');
            logo_path = uploaded.url;
        }
        
        const partner = await partnerRepository.create({
            type: req.body.type || 'university',
            name: req.body.name,
            country_category: req.body.country_category,
            website_url: req.body.website_url || null,
            logo_path: logo_path,
            description: req.body.description || null,
            social_links: {
                facebook: req.body.facebook || null,
                twitter: req.body.twitter || null,
                linkedin: req.body.linkedin || null
            },
            display_order: parseInt(req.body.display_order) || 0,
            status: req.body.status || 'active'
        });
        
        res.status(201).json({
            success: true,
            message: 'Partner created successfully',
            data: partner
        });
    } catch (error) {
        console.error('Create partner error:', error);
        next(error);
    }
};

const updatePartner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existing = await partnerRepository.findById(id);
        if (!existing) return res.status(404).json({ success: false, message: 'Partner not found' });
        
        let logo_path = existing.logo_path;
        if (req.file) {
            if (existing.logo_path) {
                const publicId = existing.logo_path.split('/').pop().split('.')[0];
                await deleteImage(`partners/${publicId}`);
            }
            const uploaded = await uploadImage(req.file, 'partners');
            logo_path = uploaded.url;
        }
        
        const updated = await partnerRepository.updateById(id, {
            name: req.body.name || existing.name,
            logo_path: logo_path,
            country_category: req.body.country_category !== undefined ? req.body.country_category : existing.country_category,
            website_url: req.body.website_url !== undefined ? req.body.website_url : existing.website_url,
            social_links: {
                facebook: req.body.facebook_link !== undefined ? req.body.facebook_link : existing.social_links?.facebook,
                twitter: req.body.twitter_link !== undefined ? req.body.twitter_link : existing.social_links?.twitter,
                linkedin: req.body.linkedin_link !== undefined ? req.body.linkedin_link : existing.social_links?.linkedin
            },
            display_order: req.body.display_order !== undefined ? req.body.display_order : existing.display_order,
            status: req.body.status || existing.status
        });
        
        res.json({ success: true, message: 'Partner updated', data: updated });
    } catch (error) { next(error); }
};

const deletePartner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const partner = await partnerRepository.findById(id);
        if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });
        
        if (partner.logo_path) {
            const publicId = partner.logo_path.split('/').pop().split('.')[0];
            await deleteImage(`partners/${publicId}`);
        }
        
        await partnerRepository.deleteById(id);
        res.json({ success: true, message: 'Partner deleted' });
    } catch (error) { next(error); }
};

const togglePartnerStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const partner = await partnerRepository.findById(id);
        if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' });
        
        const newStatus = partner.status === 'active' ? 'inactive' : 'active';
        const updated = await partnerRepository.updateById(id, { status: newStatus });
        res.json({ success: true, message: `Partner ${newStatus === 'active' ? 'activated' : 'deactivated'}`, data: updated });
    } catch (error) { next(error); }
};

const reorderPartners = async (req, res, next) => {
    try {
        const { partners } = req.body;
        const promises = partners.map(p => partnerRepository.updateById(p.id, { display_order: p.display_order }));
        await Promise.all(promises);
        res.json({ success: true, message: 'Partners reordered' });
    } catch (error) { next(error); }
};

module.exports = {
    getAllPartners,
    getPartnerById,
    getUniversities,
    getProgressionRoutes,
    searchProgressionRoutes,
    createPartner,
    updatePartner,
    deletePartner,
    togglePartnerStatus,
    reorderPartners
};