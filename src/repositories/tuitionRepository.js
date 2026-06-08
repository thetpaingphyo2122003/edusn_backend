// src/repositories/tuitionRepository.js
const BaseRepository = require('./baseRepository');
const Tuition = require('../models/Tuition');

class TuitionRepository extends BaseRepository {
    constructor() {
        super(Tuition);
    }

    async findFees() {
        return await this.findAll(
            { type: 'fee', status: 'active' },
            { sort: { category: 1, display_order: 1 } }
        );
    }

    async findByCategory(category) {
        return await this.findAll(
            { category, type: 'fee', status: 'active' },
            { sort: { display_order: 1 } }
        );
    }

    async getPaymentInfo() {
        return await this.findOne({ type: 'payment_info' });
    }

    async getVirtualAttendance() {
        return await this.findOne({ type: 'virtual_attendance' });
    }

    async getPageInfo() {
        return await this.findOne({ type: 'page_info' });
    }
}

module.exports = new TuitionRepository();