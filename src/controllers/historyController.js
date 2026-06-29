// src/controllers/historyController.js
const historyRepository = require('../repositories/historyRepository');
const { uploadImage, deleteImage } = require('../services/uploadService');
const NotificationService = require('../services/notificationService');

// Helper function to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return null;
    try {
        const parts = url.split('/');
        const versionIndex = parts.findIndex(part => part.startsWith('v'));
        if (versionIndex !== -1 && versionIndex + 1 < parts.length) {
            const publicIdWithExt = parts.slice(versionIndex + 1).join('/');
            return publicIdWithExt.split('.')[0];
        }
        return null;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};

/**
 * @desc    Get all history timeline entries (only active - for public)
 * @route   GET /api/history/timeline
 * @access  Public
 */
const getTimeline = async (req, res, next) => {
    try {
        const timeline = await historyRepository.findTimeline();
        
        res.json({
            success: true,
            count: timeline.length,
            data: timeline
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get ALL history entries including inactive (FOR ADMIN)
 * @route   GET /api/history/admin/all
 * @access  Private (Admin)
 */
const getAllHistoryAdmin = async (req, res, next) => {
    try {
        const timeline = await historyRepository.findAllTimeline();
        
        res.json({
            success: true,
            count: timeline.length,
            data: timeline
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single history entry by id
 * @route   GET /api/history/:id
 * @access  Public
 */
const getHistoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const history = await historyRepository.findById(id);
        
        if (!history) {
            return res.status(404).json({
                success: false,
                message: 'History entry not found'
            });
        }
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get history entry by year
 * @route   GET /api/history/year/:year
 * @access  Public
 */
const getHistoryByYear = async (req, res, next) => {
    try {
        const { year } = req.params;
        const history = await historyRepository.findByYear(parseInt(year));
        
        if (!history) {
            return res.status(404).json({
                success: false,
                message: 'No history entry found for this year'
            });
        }
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get history page info
 * @route   GET /api/history/page-info
 * @access  Public
 */
const getHistoryPageInfo = async (req, res, next) => {
    try {
        const pageInfo = await historyRepository.getPageInfo();
        
        res.json({
            success: true,
            data: pageInfo
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new history entry (Admin only) - WITH IMAGE UPLOAD
 * @route   POST /api/history
 * @access  Private (Admin)
 */
const createHistory = async (req, res, next) => {
    try {
        // Log what we received
        console.log('req.body:', req.body);
        console.log('req.files:', req.files);
        
        // Get fields from req.body (Multer parses text fields into req.body)
        const { year, title, description, video_url, display_order, status } = req.body;
        
        // Validate required fields
        if (!year || !title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Year, title, and description are required'
            });
        }
        
        let main_image = null;
        let gallery_images = [];
        
        // Upload main image if exists
        if (req.files && req.files.main_image) {
            const uploaded = await uploadImage(req.files.main_image[0], 'history/main');
            main_image = uploaded.url;
        }
        
        // Upload gallery images if exist
        if (req.files && req.files.gallery_images) {
            for (const file of req.files.gallery_images) {
                const uploaded = await uploadImage(file, 'history/gallery');
                gallery_images.push(uploaded.url);
            }
        }
        
        const history = await historyRepository.create({
            type: 'timeline',
            year: parseInt(year),
            title,
            description,
            main_image,
            gallery_images,
            video_url: video_url || null,
            display_order: parseInt(display_order) || 0,
            status: status || 'active'
        });
        
        if (history.type === 'timeline') {
            NotificationService.historyCreated(history, req.user._id).catch((err) =>
                console.error('History notification error:', err)
            );
        }

        res.status(201).json({
            success: true,
            message: 'History entry created successfully',
            data: history
        });
    } catch (error) {
        console.error('Create history error:', error);
        next(error);
    }
};

/**
 * @desc    Update history page info (Admin only) - WITH IMAGE UPLOAD
 * @route   POST /api/history/page-info
 * @access  Private (Admin)
 */
const updateHistoryPageInfo = async (req, res, next) => {
    try {
        const { title, content } = req.body;
        
        let pageInfo = await historyRepository.getPageInfo();
        let banner_image = pageInfo ? pageInfo.banner_image : null;
        
        // Upload new banner image if exists
        if (req.file) {
            if (pageInfo && pageInfo.banner_image) {
                try {
                    const publicId = getPublicIdFromUrl(pageInfo.banner_image);
                    if (publicId) await deleteImage(publicId);
                } catch (err) {
                    console.error('Error deleting old banner image:', err);
                }
            }
            const uploaded = await uploadImage(req.file, 'history/banner');
            banner_image = uploaded.url;
        }
        
        if (pageInfo) {
            pageInfo = await historyRepository.updateById(pageInfo._id, {
                title,
                content,
                banner_image
            });
        } else {
            pageInfo = await historyRepository.create({
                type: 'page_info',
                title,
                content,
                banner_image,
                status: 'active'
            });
        }
        
        res.json({
            success: true,
            message: 'History page info updated successfully',
            data: pageInfo
        });
    } catch (error) {
        console.error('Update page info error:', error);
        next(error);
    }
};

/**
 * @desc    Update history entry (Admin only) - WITH IMAGE UPLOAD
 * @route   PUT /api/history/:id
 * @access  Private (Admin)
 */
const updateHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { year, title, description, video_url, display_order, status, existing_main_image, existing_gallery_images } = req.body;
        
        const history = await historyRepository.findById(id);
        
        if (!history) {
            return res.status(404).json({
                success: false,
                message: 'History entry not found'
            });
        }
        
        let main_image = existing_main_image || history.main_image;
        let gallery_images = existing_gallery_images ? JSON.parse(existing_gallery_images) : history.gallery_images;
        
        // Upload new main image if exists (and delete old one)
        if (req.files && req.files.main_image) {
            if (history.main_image) {
                try {
                    const publicId = getPublicIdFromUrl(history.main_image);
                    if (publicId) await deleteImage(publicId);
                } catch (err) {
                    console.error('Error deleting old main image:', err);
                }
            }
            const uploaded = await uploadImage(req.files.main_image[0], 'history/main');
            main_image = uploaded.url;
        }
        
        // Upload new gallery images if exist
        if (req.files && req.files.gallery_images) {
            for (const file of req.files.gallery_images) {
                const uploaded = await uploadImage(file, 'history/gallery');
                gallery_images.push(uploaded.url);
            }
        }
        
        const updatedHistory = await historyRepository.updateById(id, {
            year: parseInt(year) || history.year,
            title: title || history.title,
            description: description || history.description,
            main_image: main_image,
            gallery_images: gallery_images,
            video_url: video_url !== undefined ? video_url : history.video_url,
            display_order: parseInt(display_order) !== undefined ? parseInt(display_order) : history.display_order,
            status: status || history.status
        });
        
        res.json({
            success: true,
            message: 'History entry updated successfully',
            data: updatedHistory
        });
    } catch (error) {
        console.error('Update history error:', error);
        next(error);
    }
};

/**
 * @desc    Delete history entry (Admin only)
 * @route   DELETE /api/history/:id
 * @access  Private (Admin)
 */
const deleteHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const history = await historyRepository.findById(id);
        
        if (!history) {
            return res.status(404).json({
                success: false,
                message: 'History entry not found'
            });
        }
        
        // Delete main image from Cloudinary if exists
        if (history.main_image) {
            try {
                const publicId = getPublicIdFromUrl(history.main_image);
                if (publicId) await deleteImage(publicId);
            } catch (err) {
                console.error('Error deleting main image:', err);
            }
        }
        
        // Delete gallery images from Cloudinary
        if (history.gallery_images && history.gallery_images.length > 0) {
            for (const imgUrl of history.gallery_images) {
                try {
                    const publicId = getPublicIdFromUrl(imgUrl);
                    if (publicId) await deleteImage(publicId);
                } catch (err) {
                    console.error('Error deleting gallery image:', err);
                }
            }
        }
        
        await historyRepository.deleteById(id);
        
        res.json({
            success: true,
            message: 'History entry deleted successfully'
        });
    } catch (error) {
        console.error('Delete history error:', error);
        next(error);
    }
};

/**
 * @desc    Toggle history status (active/inactive)
 * @route   PUT /api/history/:id/toggle-status
 * @access  Private (Admin)
 */
const toggleHistoryStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const history = await historyRepository.findById(id);
        
        if (!history) {
            return res.status(404).json({
                success: false,
                message: 'History entry not found'
            });
        }
        
        const newStatus = history.status === 'active' ? 'inactive' : 'active';
        const updatedHistory = await historyRepository.updateById(id, { status: newStatus });
        
        res.json({
            success: true,
            message: `History entry ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: updatedHistory
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTimeline,
    getHistoryById,
    getHistoryByYear,
    getHistoryPageInfo,
    createHistory,
    updateHistoryPageInfo,
    updateHistory,
    deleteHistory,
    toggleHistoryStatus,
    getAllHistoryAdmin
};