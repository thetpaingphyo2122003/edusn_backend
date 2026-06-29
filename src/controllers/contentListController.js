// src/controllers/contentListController.js
const ContentList = require('../models/ContentList');
const contentListRepository = require('../repositories/contentListRepository');
const { uploadImage } = require('../services/uploadService');

/**
 * @desc    Get all content items (Admin)
 * @route   GET /api/content-lists
 * @access  Private (Admin)
 */
const getAllContent = async (req, res, next) => {
    try {
        const contents = await contentListRepository.findAllContent();
        
        res.json({
            success: true,
            data: contents
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get content by parent section (Public)
 * @route   GET /api/content-lists/:parentSection
 * @access  Public
 */
const getContentByParentSection = async (req, res, next) => {
    try {
        const { parentSection } = req.params;
        const validSections = ['missions', 'offices', 'pathway', 'features', 'partners', 'quick_links'];
        
        if (!validSections.includes(parentSection)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid parent section'
            });
        }
        
        const contents = await contentListRepository.findByParentSection(parentSection);
        
        res.json({
            success: true,
            data: contents
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get missions (Public) - Matches original design
 * @route   GET /api/content-lists/missions
 * @access  Public
 */
const getMissions = async (req, res, next) => {
    try {
        const missions = await contentListRepository.getMissions();
        
        // Format missions to match original HTML structure
        const formattedMissions = missions.map((mission, index) => ({
            id: mission._id,
            number: String(mission.display_order || index + 1).padStart(2, '0'),
            title: mission.title,
            description: mission.description,
            icon: mission.icon || null,
            image: mission.image || null,
            video_url: mission.extra_data?.video_url || null
        }));
        
        res.json({
            success: true,
            data: formattedMissions
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get offices (Public) - Matches original design with 4 offices
 * @route   GET /api/content-lists/offices
 * @access  Public
 */
const getOffices = async (req, res, next) => {
    try {
        const offices = await contentListRepository.getOffices();
        
        // Format offices to match original HTML structure
        const formattedOffices = offices.map((office) => ({
            id: office._id,
            name: office.title,
            country: office.description,
            icon: office.icon,
            image: office.image,
            flag: office.extra_data?.flag || null,
            location: office.extra_data?.location || office.description
        }));
        
        res.json({
            success: true,
            data: formattedOffices
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get pathway (Public) - Matches original timeline design
 * @route   GET /api/content-lists/pathway
 * @access  Public
 */
const getPathway = async (req, res, next) => {
    try {
        const pathway = await contentListRepository.getPathway();
        
        // Format pathway to match original timeline structure
        const formattedPathway = pathway.map((item) => ({
            id: item._id,
            stage: item.title,
            years: item.extra_data?.years || [],
            age_range: item.description,
            display_order: item.display_order
        }));
        
        res.json({
            success: true,
            data: formattedPathway
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get quick links (Public)
 * @route   GET /api/content-lists/quick-links
 * @access  Public
 */
const getQuickLinks = async (req, res, next) => {
    try {
        const quickLinks = await contentListRepository.getQuickLinks();
        
        res.json({
            success: true,
            data: quickLinks
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get content item by ID
 * @route   GET /api/content-lists/item/:id
 * @access  Public
 */
const getContentItemById = async (req, res, next) => {
    try {
        const content = await contentListRepository.findById(req.params.id);
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new content item (with optional image upload)
 * @route   POST /api/content-lists
 * @access  Private (Admin)
 */
const createContentItem = async (req, res, next) => {
    try {
        console.log("Creating content item...");
        console.log("Request body:", req.body);
        console.log("Request file:", req.file);
        
        let image = null;
        
        // Handle image upload if file exists
        if (req.file) {
            try {
                const uploaded = await uploadImage(req.file, 'content-lists');
                image = uploaded.url;
                console.log("Image uploaded:", image);
            } catch (uploadError) {
                console.error("Image upload failed:", uploadError);
            }
        }
        
        // Extract data from request
        const parent_section = req.body.parent_section;
        const title = req.body.title;
        const description = req.body.description || null;
        const icon = req.body.icon || null;
        let display_order = parseInt(req.body.display_order) || 0;
        const status = req.body.status || 'active';
        
        // Parse extra_data if it's a string (from FormData)
        let extra_data = null;
        if (req.body.extra_data) {
            try {
                extra_data = typeof req.body.extra_data === 'string' 
                    ? JSON.parse(req.body.extra_data) 
                    : req.body.extra_data;
            } catch (e) {
                extra_data = req.body.extra_data;
            }
        }
        
        // If no display_order provided, get the max + 1
        if (display_order === 0) {
            const lastItem = await ContentList.findOne({ parent_section })
                .sort({ display_order: -1 });
            display_order = lastItem ? lastItem.display_order + 1 : 1;
        }
        
        // Validate required fields
        if (!parent_section || !title) {
            return res.status(400).json({
                success: false,
                message: 'Parent section and title are required'
            });
        }
        
        const contentItem = await ContentList.create({
            parent_section,
            title,
            description,
            icon,
            image: image || null,
            extra_data,
            display_order,
            status
        });
        
        res.status(201).json({
            success: true,
            message: 'Content item created successfully',
            data: contentItem
        });
    } catch (error) {
        console.error("Error creating content item:", error);
        next(error);
    }
};

/**
 * @desc    Update a content item (with optional image upload)
 * @route   PUT /api/content-lists/:id
 * @access  Private (Admin)
 */
const updateContentItem = async (req, res, next) => {
    try {
        console.log("Updating content item...");
        console.log("Request body:", req.body);
        console.log("Request file:", req.file);
        
        const content = await contentListRepository.findById(req.params.id);
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        let image = content.image;
        
        // Handle new image upload if file exists
        if (req.file) {
            try {
                const uploaded = await uploadImage(req.file, 'content-lists');
                image = uploaded.url;
                console.log("New image uploaded:", image);
            } catch (uploadError) {
                console.error("Image upload failed:", uploadError);
            }
        } else if (req.body.image_url) {
            image = req.body.image_url;
        } else if (req.body.image === 'null' || req.body.image === 'undefined') {
            image = null;
        }
        
        // Extract data from request
        const updateData = {
            parent_section: req.body.parent_section || content.parent_section,
            title: req.body.title || content.title,
            description: req.body.description !== undefined ? req.body.description : content.description,
            icon: req.body.icon !== undefined ? req.body.icon : content.icon,
            image: image,
            display_order: req.body.display_order !== undefined ? parseInt(req.body.display_order) : content.display_order,
            status: req.body.status || content.status
        };
        
        // Handle extra_data
        if (req.body.extra_data) {
            try {
                updateData.extra_data = typeof req.body.extra_data === 'string' 
                    ? JSON.parse(req.body.extra_data) 
                    : req.body.extra_data;
            } catch (e) {
                updateData.extra_data = req.body.extra_data;
            }
        }
        
        // ✅ FIXED: Use updateById instead of update
        const updated = await contentListRepository.updateById(req.params.id, updateData);
        
        res.json({
            success: true,
            message: 'Content item updated successfully',
            data: updated
        });
    } catch (error) {
        console.error("Error updating content item:", error);
        next(error);
    }
};

/**
 * @desc    Toggle content status (active/inactive)
 * @route   PUT /api/content-lists/:id/toggle-status
 * @access  Private (Admin)
 */
const toggleContentStatus = async (req, res, next) => {
    try {
        const content = await contentListRepository.findById(req.params.id);
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        const newStatus = content.status === 'active' ? 'inactive' : 'active';
        
        // ✅ FIXED: Use updateById instead of update
        const updated = await contentListRepository.updateById(req.params.id, { status: newStatus });
        
        res.json({
            success: true,
            message: `Content ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: updated
        });
    } catch (error) {
        console.error("Error toggling status:", error);
        next(error);
    }
};

/**
 * @desc    Reorder content items
 * @route   PUT /api/content-lists/reorder
 * @access  Private (Admin)
 */
const reorderContentItems = async (req, res, next) => {
    try {
        const { parent_section, items } = req.body;
        
        if (!parent_section || !items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: 'Parent section and items array are required'
            });
        }
        
        // Update each item's display_order
        const updates = items.map(item => 
            ContentList.findByIdAndUpdate(item.id, { display_order: item.display_order })
        );
        
        await Promise.all(updates);
        
        // Return updated items
        const updatedItems = await ContentList.find({ parent_section })
            .sort({ display_order: 1 });
        
        res.json({
            success: true,
            message: 'Items reordered successfully',
            data: updatedItems
        });
    } catch (error) {
        console.error("Reorder error:", error);
        next(error);
    }
};

/**
 * @desc    Delete a content item
 * @route   DELETE /api/content-lists/:id
 * @access  Private (Admin)
 */
const deleteContentItem = async (req, res, next) => {
    try {
        const content = await contentListRepository.findById(req.params.id);
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }
        
        await contentListRepository.deleteById(req.params.id);
        
        res.json({
            success: true,
            message: 'Content item deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllContent,  
    getContentByParentSection,
    getMissions,
    getOffices,
    getPathway,
    getQuickLinks,
    getContentItemById,
    createContentItem,
    updateContentItem,
    toggleContentStatus,
    reorderContentItems,
    deleteContentItem
};