    // src/controllers/userController.js
    const userRepository = require('../repositories/userRepository');
    const bcrypt = require('bcryptjs');

    // src/controllers/userController.js
    // Update the getAllUsers function to allow staff to search

    /**
     * @desc    Get ALL users (for admin)
     * @desc    Search users (for staff to find chat participants)
     * @route   GET /api/users
     * @access  Private (Admin or Staff with search)
     */
    const getAllUsers = async (req, res, next) => {
        try {
            const { page = 1, limit = 10, role, status, search } = req.query;
            const privilegedRoles = ['admin', 'super_admin'];
            const canListAll = privilegedRoles.includes(req.user.role);
            const normalizedSearch = String(search || '').trim();

            if (!canListAll && !normalizedSearch) {
                return res.status(403).json({
                    success: false,
                    message: 'Search is required to look up users'
                });
            }

            if (normalizedSearch.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is too long'
                });
            }

            let filter = {};
            
            if (role && role !== 'all') filter.role = role;
            if (status && status !== 'all') filter.status = status;
            
            if (normalizedSearch) {
                filter.$or = [
                    { username: { $regex: normalizedSearch, $options: 'i' } },
                    { email: { $regex: normalizedSearch, $options: 'i' } },
                    { full_name: { $regex: normalizedSearch, $options: 'i' } }
                ];
            }
            
            const { users, total } = await userRepository.getUsersWithPagination(
                parseInt(page), 
                parseInt(limit), 
                filter
            );
            
            const safeUsers = users.map(user => {
                const userObj = user.toObject ? user.toObject() : user;
                delete userObj.password;
                return userObj;
            });
            
            res.json({
                success: true,
                data: safeUsers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * @desc    Get single user by id
     * @route   GET /api/users/:id
     * @access  Private (Admin only)
     */
    const getUserById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const privilegedRoles = ['admin', 'super_admin', 'staff'];
            const isSelf = req.user._id.toString() === id;

            if (!isSelf && !privilegedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this user'
                });
            }

            const user = await userRepository.findById(id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            const userObj = user.toObject ? user.toObject() : user;
            delete userObj.password;
            
            res.json({
                success: true,
                data: userObj
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * @desc    Get user online status
     * @route   GET /api/users/:id/status
     * @access  Private
     */
    const getUserStatus = async (req, res, next) => {
        try {
            const { id } = req.params;
            
            const user = await userRepository.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Get online status from socket (you need to export onlineUsers or create a getter)
            let isOnline = false;
            try {
                const { getOnlineUsers } = require('../socket/chatSocket');
                const onlineUsers = getOnlineUsers ? getOnlineUsers() : new Map();
                isOnline = onlineUsers.has(id);
            } catch (error) {
                // If socket module not available, fallback to checking last_login within last 5 minutes
                if (user.last_login) {
                    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                    isOnline = user.last_login > fiveMinutesAgo;
                }
            }
            
            // Get last seen from user's last_login
            const lastSeen = user.last_login || null;
            
            res.json({
                success: true,
                data: {
                    user_id: id,
                    is_online: isOnline,
                    last_seen: lastSeen,
                    name: user.full_name || user.username
                }
            });
        } catch (error) {
            console.error('Get user status error:', error);
            next(error);
        }
    };

    /**
     * @desc    Create new user (Admin only)
     * @route   POST /api/users
     * @access  Private (Admin only)
     */
    const createUser = async (req, res, next) => {
        try {
            const { 
                username, 
                email, 
                password, 
                full_name, 
                role, 
                department,
                position,
                phone
            } = req.body;
            
            // Validation
            if (!username || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Username, email and password are required'
                });
            }
            
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters'
                });
            }
            
            // Check existing
            const emailExists = await userRepository.isEmailExist(email);
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
            
            const usernameExists = await userRepository.isUsernameExist(username);
            if (usernameExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }
            
            // Set default role
            const userRole = role || 'viewer';
            
            const user = await userRepository.create({
                username,
                email,
                password,
                full_name: full_name || null,
                role: userRole,
                status: 'active',
                department: department || null,
                position: position || null,
                phone: phone || null,
                created_by: req.user._id
            });
            
            const userObj = user.toObject ? user.toObject() : user;
            delete userObj.password;
            
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: userObj
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * @desc    Update user (Admin only)
     * @route   PUT /api/users/:id
     * @access  Private (Admin only)
     */
    const updateUser = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { username, email, full_name, role, department, position, phone } = req.body;
            
            const existingUser = await userRepository.findById(id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Prevent admin from modifying their own role
            if (existingUser._id.toString() === req.user._id.toString() && role && role !== existingUser.role) {
                return res.status(400).json({
                    success: false,
                    message: 'You cannot change your own role'
                });
            }
            
            // Check if email already taken by another user
            if (email && email !== existingUser.email) {
                const emailExists = await userRepository.isEmailExist(email, id);
                if (emailExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already exists'
                    });
                }
            }
            
            // Check if username already taken by another user
            if (username && username !== existingUser.username) {
                const usernameExists = await userRepository.isUsernameExist(username, id);
                if (usernameExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username already exists'
                    });
                }
            }
            
            const updatedUser = await userRepository.updateUser(id, {
                username: username || existingUser.username,
                email: email || existingUser.email,
                full_name: full_name !== undefined ? full_name : existingUser.full_name,
                role: role || existingUser.role,
                department: department !== undefined ? department : existingUser.department,
                position: position !== undefined ? position : existingUser.position,
                phone: phone !== undefined ? phone : existingUser.phone
            });
            
            const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
            delete userObj.password;
            
            res.json({
                success: true,
                message: 'User updated successfully',
                data: userObj
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * @desc    Delete user (Admin only)
     * @route   DELETE /api/users/:id
     * @access  Private (Admin only)
     */
    const deleteUser = async (req, res, next) => {
        try {
            const { id } = req.params;
            
            const user = await userRepository.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Prevent admin from deleting themselves
            if (user._id.toString() === req.user._id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'You cannot delete your own account'
                });
            }
            
            await userRepository.deleteById(id);
            
            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * @desc    Toggle user status (active/inactive)
     * @route   PUT /api/users/:id/toggle-status
     * @access  Private (Admin only)
     */
    const toggleUserStatus = async (req, res, next) => {
        try {
            const { id } = req.params;
            
            const user = await userRepository.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Prevent admin from deactivating themselves
            if (user._id.toString() === req.user._id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'You cannot change your own status'
                });
            }
            
            const updatedUser = await userRepository.toggleStatus(id);
            const newStatus = updatedUser.status;
            
            const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
            delete userObj.password;
            
            res.json({
                success: true,
                message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
                data: userObj
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * @desc    Change user role (Admin only)
     * @route   PUT /api/users/:id/change-role
     * @access  Private (Admin only)
     */
    const changeUserRole = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { role } = req.body;
            
            if (!role || !['admin', 'staff', 'viewer'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role. Must be admin, staff, or viewer'
                });
            }
            
            const user = await userRepository.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Prevent admin from changing their own role
            if (user._id.toString() === req.user._id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'You cannot change your own role'
                });
            }
            
            const updatedUser = await userRepository.changeRole(id, role);
            
            const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
            delete userObj.password;
            
            res.json({
                success: true,
                message: `User role changed to ${role} successfully`,
                data: userObj
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * @desc    Reset user password (Admin only)
     * @route   PUT /api/users/:id/reset-password
     * @access  Private (Admin only)
     */
    const resetUserPassword = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { password } = req.body;
            
            if (!password || password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters'
                });
            }
            
            const user = await userRepository.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            await userRepository.resetPassword(id, password);
            
            res.json({
                success: true,
                message: 'Password reset successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * @desc    Get user statistics (Admin only)
     * @route   GET /api/users/stats
     * @access  Private (Admin only)
     */
    const getUserStats = async (req, res, next) => {
        try {
            const stats = await userRepository.getStats();
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    };

    // src/controllers/userController.js

    // ✅ getMyProfile - ရှိပြီးသား
    const getMyProfile = async (req, res, next) => {
        try {
            const user = await userRepository.findById(req.user._id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            const userObj = user.toObject ? user.toObject() : user;
            delete userObj.password;
            
            res.json({
                success: true,
                data: userObj
            });
        } catch (error) {
            next(error);
        }
    };

    // ✅ updateMyProfile - ရှိပြီးသား
    const updateMyProfile = async (req, res, next) => {
        try {
            const { full_name, email, phone, department, position } = req.body;
            
            const updateData = {};
            if (full_name !== undefined) updateData.full_name = full_name;
            if (phone !== undefined) updateData.phone = phone;
            if (department !== undefined) updateData.department = department;
            if (position !== undefined) updateData.position = position;
                
            if (email && email !== req.user.email) {
                const emailExists = await userRepository.isEmailExist(email, req.user._id);
                if (emailExists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already exists'
                    });
                }
                updateData.email = email;
            }
            
            const updatedUser = await userRepository.updateUser(req.user._id, updateData);
            
            const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
            delete userObj.password;
            
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: userObj
            });
        } catch (error) {
            next(error);
        }
    };

    const changeMyPassword = async (req, res, next) => {
        try {
            const { currentPassword, newPassword } = req.body;
            
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required'
                });
            }
            
            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be at least 6 characters'
                });
            }
            
            const user = await userRepository.findByEmailWithPassword(req.user.email);
            
            const isPasswordValid = await user.comparePassword(currentPassword);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }
            
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            await userRepository.updateUser(req.user._id, { password: hashedPassword });
            
            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            next(error);
        }
    };


  
    const getProfile = async (req, res, next) => {
        try {
            const user = await userRepository.findById(req.user._id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            const userObj = user.toObject ? user.toObject() : user;
            delete userObj.password;
            
            res.json({
                success: true,
                data: userObj
            });
        } catch (error) {
            next(error);
        }
    };

        
    module.exports = {
        getAllUsers,
        getUserById,
        getUserStatus,  // ✅ Add this
        getProfile,      // ✅ Add this
        createUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        changeUserRole,
        resetUserPassword,
        getUserStats,
        getMyProfile,
        updateMyProfile,
        changeMyPassword
    };