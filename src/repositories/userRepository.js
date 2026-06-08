// src/repositories/userRepository.js
const BaseRepository = require('./baseRepository');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

class UserRepository extends BaseRepository {
    constructor() {
        super(User);
    }

    async findByEmail(email) {
        return await this.findOne({ email });
    }

    async findByUsername(username) {
        return await this.findOne({ username });
    }

    async findByEmailWithPassword(email) {
        return await this.model.findOne({ email }).select('+password');
    }

    async findByRole(role) {
        return await this.findAll({ role, status: 'active' });
    }

    async findByStatus(status) {
        return await this.findAll({ status });
    }

    async updateLastLogin(id) {
        return await this.updateById(id, { last_login: new Date() });
    }

    async countActiveUsers() {
        return await this.count({ status: 'active' });
    }

    async countByRole(role) {
        return await this.count({ role });
    }

    async isEmailExist(email, excludeId = null) {
        const filter = { email };
        if (excludeId) filter._id = { $ne: excludeId };
        const user = await this.findOne(filter);
        return !!user;
    }

    async isUsernameExist(username, excludeId = null) {
        const filter = { username };
        if (excludeId) filter._id = { $ne: excludeId };
        const user = await this.findOne(filter);
        return !!user;
    }

    async findAllUsers(filter = {}) {
        return await this.findAll(filter, { sort: { createdAt: -1 } });
    }

    async getUsersWithPagination(page = 1, limit = 10, filter = {}) {
        const skip = (page - 1) * limit;
        const users = await this.findAll(filter, {
            sort: { createdAt: -1 },
            skip: skip,
            limit: limit
        });
        const total = await this.count(filter);
        return { users, total };
    }

    async toggleStatus(id) {
        const user = await this.findById(id);
        if (!user) return null;
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        return await this.updateById(id, { status: newStatus });
    }

    async resetPassword(id, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        return await this.updateById(id, { password: hashedPassword });
    }

    async updateUser(id, updateData) {
        if (updateData.password) {
            delete updateData.password;
        }
        return await this.updateById(id, updateData);
    }

    async getStats() {
        const total = await this.count();
        const active = await this.count({ status: 'active' });
        const inactive = await this.count({ status: 'inactive' });
        
        const admin = await this.count({ role: 'admin' });
        const staff = await this.count({ role: 'staff' });
        const viewer = await this.count({ role: 'viewer' });
        
        return {
            total,
            active,
            inactive,
            byRole: { admin, staff, viewer }
        };
    }
}

module.exports = new UserRepository();