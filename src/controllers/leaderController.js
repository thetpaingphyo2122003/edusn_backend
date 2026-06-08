// src/controllers/leaderController.js
const leaderRepository = require('../repositories/leaderRepository');
const { uploadImage, deleteImage } = require('../services/uploadService');  
/**
 * @desc    Get all active leaders (for public)
 * @route   GET /api/leaders
 * @access  Public
 */
const getAllLeaders = async (req, res, next) => {
    try {
        // ✅ findActive ကို findAllActive လို့ ပြင်ထားတယ် (repository နဲ့ ကိုက်အောင်)
        const leaders = await leaderRepository.findAllActive();
        
        res.json({
            success: true,
            count: leaders.length,
            data: leaders
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single leader by id
 * @route   GET /api/leaders/:id
 * @access  Public
 */
const getLeaderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const leader = await leaderRepository.findById(id);
        
        if (!leader) {
            return res.status(404).json({
                success: false,
                message: 'Leader not found'
            });
        }
        
        res.json({
            success: true,
            data: leader
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get leader by position
 * @route   GET /api/leaders/position/:position
 * @access  Public
 */
const getLeaderByPosition = async (req, res, next) => {
    try {
        const { position } = req.params;
        // ✅ findByPosition က array ပြန်တယ် (single မဟုတ်ဘူး)
        const leaders = await leaderRepository.findByPosition(position);
        
        if (!leaders || leaders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No leaders found with this position'
            });
        }
        
        res.json({
            success: true,
            count: leaders.length,
            data: leaders
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new leader (Admin only)
 * @route   POST /api/leaders
 * @access  Private (Admin)
 */
const createLeader = async (req, res, next) => {
    try {
        let photo = null;
        
        // Upload image if exists
        if (req.file) {
            const uploaded = await uploadImage(req.file, 'leaders');
            photo = uploaded.url;
        }
        
        const leader = await leaderRepository.create({
            name: req.body.name,
            position: req.body.position,
            qualification: req.body.qualification || null,
            bio: req.body.bio || null,
            email: req.body.email || null,
            photo: photo,
            display_order: req.body.display_order || 0,
            status: req.body.status || 'active'
        });
        
        res.status(201).json({
            success: true,
            message: 'Leader created successfully',
            data: leader
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update leader (Admin only)
 * @route   PUT /api/leaders/:id
 * @access  Private (Admin)
 */
const updateLeader = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existingLeader = await leaderRepository.findById(id);
        
        if (!existingLeader) {
            return res.status(404).json({
                success: false,
                message: 'Leader not found'
            });
        }
        
        let photo = existingLeader.photo;
        
        // Upload new image if exists
        if (req.file) {
            // Delete old image from cloudinary
            if (existingLeader.photo) {
                const publicId = existingLeader.photo.split('/').pop().split('.')[0];
                await deleteImage(`leaders/${publicId}`);
            }
            const uploaded = await uploadImage(req.file, 'leaders');
            photo = uploaded.url;
        }
        
        const updatedLeader = await leaderRepository.updateById(id, {
            name: req.body.name || existingLeader.name,
            position: req.body.position || existingLeader.position,
            qualification: req.body.qualification !== undefined ? req.body.qualification : existingLeader.qualification,
            bio: req.body.bio !== undefined ? req.body.bio : existingLeader.bio,
            email: req.body.email !== undefined ? req.body.email : existingLeader.email,
            photo: photo,
            display_order: req.body.display_order !== undefined ? req.body.display_order : existingLeader.display_order,
            status: req.body.status || existingLeader.status
        });
        
        res.json({
            success: true,
            message: 'Leader updated successfully',
            data: updatedLeader
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete leader (Admin only)
 * @route   DELETE /api/leaders/:id
 * @access  Private (Admin)
 */
const deleteLeader = async (req, res, next) => {
    try {
        const { id } = req.params;
        const leader = await leaderRepository.findById(id);
        
        if (!leader) {
            return res.status(404).json({
                success: false,
                message: 'Leader not found'
            });
        }
        
        // Delete image from cloudinary if exists
        if (leader.photo) {
            const publicId = leader.photo.split('/').pop().split('.')[0];
            await deleteImage(`leaders/${publicId}`);
        }
        
        await leaderRepository.deleteById(id);
        
        res.json({
            success: true,
            message: 'Leader deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle leader status (active/inactive)
 * @route   PUT /api/leaders/:id/toggle-status
 * @access  Private (Admin)
 */
const toggleLeaderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const leader = await leaderRepository.findById(id);
        
        if (!leader) {
            return res.status(404).json({
                success: false,
                message: 'Leader not found'
            });
        }
        
        // ✅ status ကို active/inactive လို့ သုံးမယ်
        const newStatus = leader.is_active === true ? false : true;
        const updatedLeader = await leaderRepository.updateById(id, { is_active: newStatus });
        
        res.json({
            success: true,
            message: `Leader ${newStatus ? 'activated' : 'deactivated'} successfully`,
            data: updatedLeader
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reorder leaders (update display_order)
 * @route   PUT /api/leaders/reorder
 * @access  Private (Admin)
 */
const reorderLeaders = async (req, res, next) => {
    try {
        const { positions } = req.body;  // ✅ positions လို့ သုံးထားတယ်
        
        // ✅ validation ထည့်ပါ
        if (!positions) {
            return res.status(400).json({
                success: false,
                message: 'Positions array is required'
            });
        }
        
        if (!Array.isArray(positions)) {
            return res.status(400).json({
                success: false,
                message: 'Positions must be an array'
            });
        }
        
        if (positions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Positions array cannot be empty'
            });
        }
        
        // ✅ positions အတိုင်း update လုပ်မယ်
        const updatePromises = positions.map(item => 
            leaderRepository.updateById(item.id, { display_order: item.display_order })
        );
        
        await Promise.all(updatePromises);
        
        // ✅ ပြင်ဆင်ပြီးသား leaders တွေကို ပြန်ယူမယ်
        const updatedLeaders = await leaderRepository.findAllActive();
        
        res.json({
            success: true,
            message: 'Leaders reordered successfully',
            data: updatedLeaders
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get ALL leaders for admin (including inactive)
 * @route   GET /api/leaders/admin/all
 * @access  Private (Admin)
 */
const getAllLeadersAdmin = async (req, res, next) => {
    try {
        const leaders = await leaderRepository.findAllLeaders();
        
        res.json({
            success: true,
            count: leaders.length,
            data: leaders
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllLeaders,
    getLeaderById,
    getLeaderByPosition,
    createLeader,
    updateLeader,
    deleteLeader,
    toggleLeaderStatus,
    reorderLeaders,
    getAllLeadersAdmin
};