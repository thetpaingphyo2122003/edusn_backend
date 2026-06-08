// src/repositories/timetableRepository.js
const BaseRepository = require('./baseRepository');
const Timetable = require('../models/Timetable');

class TimetableRepository extends BaseRepository {
    constructor() {
        super(Timetable);
    }

    async findByAcademicYear(year) {
        return await this.findAll(
            { academic_year: year, status: 'active' },
            { sort: { display_order: 1 } }
        );
    }

    async findByClass(year, className) {
        return await this.findAll(
            { academic_year: year, class_name: className, status: 'active' },
            { sort: { day_of_week: 1 } }
        );
    }

    async getAcademicYears() {
        return await this.model.distinct('academic_year', { status: 'active' });
    }
}

module.exports = new TimetableRepository();