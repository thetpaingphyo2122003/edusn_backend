// src/repositories/awardRepository.js
const BaseRepository = require('./baseRepository');
const Award = require('../models/Award');

class AwardRepository extends BaseRepository {
    constructor() {
        super(Award);
    }

    async findByAcademicYear(year) {
        return await this.findAll(
            { academic_year: year, status: 'active' },
            { sort: { campus: 1, display_order: 1 } }
        );
    }

    async findByCampus(campus, year) {
        const filter = { campus, status: 'active' };
        if (year) filter.academic_year = year;
        return await this.findAll(filter, { sort: { display_order: 1 } });
    }

    async findTeacherAwards(year) {
        return await this.findAll(
            { award_category: 'Students Favorite Teacher Award', academic_year: year },
            { sort: { campus: 1 } }
        );
    }

    async findStudentAwards(year) {
        return await this.findAll(
            { award_category: { $ne: 'Students Favorite Teacher Award' }, academic_year: year },
            { sort: { campus: 1, award_category: 1 } }
        );
    }

    // ✅ NEW: Get ALL awards for admin (both active and inactive)
    async findAllForAdmin(filter = {}) {
        return await this.findAll(filter, { sort: { createdAt: -1 } });
    }

    // ✅ NEW: Get awards by status
    async findByStatus(status) {
        return await this.findAll({ status }, { sort: { createdAt: -1 } });
    }
}

module.exports = new AwardRepository();