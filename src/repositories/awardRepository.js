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
            { sort: { display_order: 1, campus: 1 } }
        );
    }

    async findByCampus(campus, year) {
        const filter = { campus, status: 'active' };
        if (year) filter.academic_year = year;
        return await this.findAll(filter, { sort: { display_order: 1 } });
    }

    async findTeacherAwards(year) {
        const filter = {
            academic_year: year,
            status: 'active',
            teacher_name: { $ne: null },
        };
        return await this.findAll(filter, { sort: { campus: 1, display_order: 1 } });
    }

    async findStudentAwards(year) {
        return await this.findAll(
            {
                academic_year: year,
                status: 'active',
                student_name: { $ne: null },
            },
            { sort: { campus: 1, award_category: 1, display_order: 1 } }
        );
    }

    async findAllForAdmin(filter = {}) {
        return await this.findAll(filter, { sort: { academic_year: -1, display_order: 1, createdAt: -1 } });
    }

    async findByStatus(status) {
        return await this.findAll({ status }, { sort: { createdAt: -1 } });
    }

    async getAvailableYears(activeOnly = true) {
        const filter = activeOnly ? { status: 'active' } : {};
        return Award.distinct('academic_year', filter);
    }
}

module.exports = new AwardRepository();