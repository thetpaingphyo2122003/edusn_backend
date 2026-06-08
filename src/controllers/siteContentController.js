// src/controllers/siteContentController.js
const siteContentRepository = require('../repositories/siteContentRepository');
const { uploadImage, deleteImage } = require('../services/uploadService');

/**
 * @desc    Get hero section content
 * @route   GET /api/site-content/hero
 * @access  Public
 */
const getHero = async (req, res, next) => {
    try {
        const hero = await siteContentRepository.getHero();
        
        res.json({
            success: true,
            data: hero
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get about section content
 * @route   GET /api/site-content/about
 * @access  Public
 */
const getAbout = async (req, res, next) => {
    try {
        const about = await siteContentRepository.getAbout();
        
        res.json({
            success: true,
            data: about
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get culture section content
 * @route   GET /api/site-content/culture
 * @access  Public
 */
const getCulture = async (req, res, next) => {
    try {
        const culture = await siteContentRepository.getCulture();
        
        res.json({
            success: true,
            data: culture
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get mission section content
 * @route   GET /api/site-content/mission
 * @access  Public
 */
const getMission = async (req, res, next) => {
    try {
        const mission = await siteContentRepository.getMission();
        
        res.json({
            success: true,
            data: mission
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get statistics section
 * @route   GET /api/site-content/statistics
 * @access  Public
 */
const getStatistics = async (req, res, next) => {
    try {
        const statistics = await siteContentRepository.getStatistics();
        
        res.json({
            success: true,
            data: statistics?.extra_data || null
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get attending virtually section
 * @route   GET /api/site-content/attending-virtually
 * @access  Public
 */
const getAttendingVirtually = async (req, res, next) => {
    try {
        const attendingVirtually = await siteContentRepository.getAttendingVirtually();
        
        res.json({
            success: true,
            data: attendingVirtually
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all site content (for admin)
 * @route   GET /api/site-content/all
 * @access  Private (Admin)
 */
const getAllSiteContent = async (req, res, next) => {
    try {
        const [hero, about, culture, mission, statistics, attendingVirtually] = await Promise.all([
            siteContentRepository.getHero(),
            siteContentRepository.getAbout(),
            siteContentRepository.getCulture(),
            siteContentRepository.getMission(),
            siteContentRepository.getStatistics(),
            siteContentRepository.getAttendingVirtually()
        ]);
        
        res.json({
            success: true,
            data: {
                hero,
                about,
                culture,
                mission,
                statistics: statistics?.extra_data || null,
                attending_virtually: attendingVirtually
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single site content by section key
 * @route   GET /api/site-content/:sectionKey
 * @access  Public
 */
const getSiteContentByKey = async (req, res, next) => {
    try {
        const { sectionKey } = req.params;
        const validKeys = ['hero', 'about', 'culture', 'mission', 'statistics', 'attending_virtually'];
        
        if (!validKeys.includes(sectionKey)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid section key. Allowed: hero, about, culture, mission, statistics, attending_virtually'
            });
        }
        
        const content = await siteContentRepository.findOne({ section_key: sectionKey });
        
        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update hero section (Admin only) - WITH OPTIONAL IMAGE UPLOAD
 * @route   PUT /api/site-content/hero
 * @access  Private (Admin)
 */
const updateHero = async (req, res, next) => {
    try {
        const { title, content, sub_content, button_text, button_link } = req.body;
        
        let image = null;
        
        // Only try to upload if a file was actually provided
        if (req.file && req.file.buffer) {
            try {
                const uploaded = await uploadImage(req.file, 'site-content');
                image = uploaded.url;
                console.log("Image uploaded successfully:", image);
            } catch (uploadError) {
                console.error("Image upload failed:", uploadError);
            }
        } else if (req.body.image && req.body.image !== 'undefined' && req.body.image !== 'null') {
            image = req.body.image;
        }
        
        const updateData = {
            title: title || null,
            content: content || null,
            sub_content: sub_content || null,
            button_text: button_text || null,
            button_link: button_link || null
        };
        
        if (image) {
            updateData.image = image;
        }
        
        const hero = await siteContentRepository.updateByKey('hero', updateData);
        
        res.json({
            success: true,
            message: 'Hero section updated successfully',
            data: hero
        });
    } catch (error) {
        console.error("Error updating hero:", error);
        next(error);
    }
};
// Update the updateAbout, updateCulture, updateMission functions

/**
 * @desc    Update about section (Admin only) - WITH OPTIONAL IMAGE UPLOAD
 * @route   PUT /api/site-content/about
 * @access  Private (Admin)
 */
const updateAbout = async (req, res, next) => {
    try {
        const { title, content, button_text, button_link } = req.body;
        
        let image = null;
        
        // Only try to upload if a file was actually provided
        if (req.file && req.file.buffer) {
            try {
                const uploaded = await uploadImage(req.file, 'site-content');
                image = uploaded.url;
                console.log("Image uploaded successfully:", image);
            } catch (uploadError) {
                console.error("Image upload failed:", uploadError);
                // Continue without image if upload fails
            }
        } else if (req.body.image && req.body.image !== 'undefined' && req.body.image !== 'null') {
            // Keep existing image if provided as string
            image = req.body.image;
            console.log("Keeping existing image:", image);
        }
        
        const updateData = {
            title: title || null,
            content: content || null,
            button_text: button_text || null,
            button_link: button_link || null
        };
        
        // Only add image to updateData if we have one
        if (image) {
            updateData.image = image;
        }
        
        console.log("Updating about section with:", { ...updateData, hasImage: !!image });
        
        const about = await siteContentRepository.updateByKey('about', updateData);
        
        res.json({
            success: true,
            message: 'About section updated successfully',
            data: about
        });
    } catch (error) {
        console.error("Error updating about:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update about section",
            error: error.message
        });
    }
};

/**
 * @desc    Update culture section (Admin only) - WITH OPTIONAL IMAGE UPLOAD
 * @route   PUT /api/site-content/culture
 * @access  Private (Admin)
 */
const updateCulture = async (req, res, next) => {
    try {
        const { title, content } = req.body;
        
        let image = null;
        
        // Only try to upload if a file was actually provided
        if (req.file && req.file.buffer) {
            try {
                const uploaded = await uploadImage(req.file, 'site-content');
                image = uploaded.url;
                console.log("Image uploaded successfully:", image);
            } catch (uploadError) {
                console.error("Image upload failed:", uploadError);
            }
        } else if (req.body.image && req.body.image !== 'undefined' && req.body.image !== 'null') {
            image = req.body.image;
            console.log("Keeping existing image:", image);
        }
        
        const updateData = {
            title: title || null,
            content: content || null
        };
        
        if (image) {
            updateData.image = image;
        }
        
        console.log("Updating culture with:", { ...updateData, hasImage: !!image });
        
        const culture = await siteContentRepository.updateByKey('culture', updateData);
        
        res.json({
            success: true,
            message: 'Culture section updated successfully',
            data: culture
        });
    } catch (error) {
        console.error("Error updating culture:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update culture section",
            error: error.message
        });
    }
};

/**
 * @desc    Update mission section (Admin only) - WITH OPTIONAL IMAGE UPLOAD
 * @route   PUT /api/site-content/mission
 * @access  Private (Admin)
 */
const updateMission = async (req, res, next) => {
    try {
        const { title, content } = req.body;
        
        let image = null;
        
        // Only try to upload if a file was actually provided
        if (req.file && req.file.buffer) {
            try {
                const uploaded = await uploadImage(req.file, 'site-content');
                image = uploaded.url;
                console.log("Image uploaded successfully:", image);
            } catch (uploadError) {
                console.error("Image upload failed:", uploadError);
            }
        } else if (req.body.image && req.body.image !== 'undefined' && req.body.image !== 'null') {
            image = req.body.image;
            console.log("Keeping existing image:", image);
        }
        
        const updateData = {
            title: title || null,
            content: content || null
        };
        
        if (image) {
            updateData.image = image;
        }
        
        console.log("Updating mission with:", { ...updateData, hasImage: !!image });
        
        const mission = await siteContentRepository.updateByKey('mission', updateData);
        
        res.json({
            success: true,
            message: 'Mission section updated successfully',
            data: mission
        });
    } catch (error) {
        console.error("Error updating mission:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update mission section",
            error: error.message
        });
    }
};
/**
 * @desc    Update statistics section (Admin only)
 * @route   PUT /api/site-content/statistics
 * @access  Private (Admin)
 */
const updateStatistics = async (req, res, next) => {
    try {
        const { extra_data } = req.body;
        
        const statistics = await siteContentRepository.updateByKey('statistics', {
            extra_data: extra_data || {}
        });
        
        res.json({
            success: true,
            message: 'Statistics section updated successfully',
            data: statistics?.extra_data
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update attending virtually section (Admin only)
 * @route   PUT /api/site-content/attending-virtually
 * @access  Private (Admin)
 */
const updateAttendingVirtually = async (req, res, next) => {
    try {
        const { title, content, button_text, button_link, extra_data } = req.body;
        
        const attendingVirtually = await siteContentRepository.updateByKey('attending_virtually', {
            title: title || null,
            content: content || null,
            button_text: button_text || null,
            button_link: button_link || null,
            extra_data: extra_data || {}
        });
        
        res.json({
            success: true,
            message: 'Attending virtually section updated successfully',
            data: attendingVirtually
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete site content (Admin only)
 * @route   DELETE /api/site-content/:sectionKey
 * @access  Private (Admin)
 */
const deleteSiteContent = async (req, res, next) => {
    try {
        const { sectionKey } = req.params;
        
        const content = await siteContentRepository.findOne({ section_key: sectionKey });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Site content not found'
            });
        }
        
        // Delete image from cloudinary if exists
        if (content.image) {
            try {
                const publicId = content.image.split('/').pop().split('.')[0];
                await deleteImage(`site-content/${publicId}`);
            } catch (err) {
                console.error('Error deleting image:', err);
            }
        }
        
        await siteContentRepository.deleteById(content._id);
        
        res.json({
            success: true,
            message: 'Site content deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getHero,
    getAbout,
    getCulture,
    getMission,
    getStatistics,
    getAttendingVirtually,
    getAllSiteContent,
    getSiteContentByKey,
    updateHero,
    updateAbout,
    updateCulture,
    updateMission,
    updateStatistics,
    updateAttendingVirtually,
    deleteSiteContent
};