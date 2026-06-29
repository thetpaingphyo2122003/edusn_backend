// src/repositories/subjectRepository.js
const BaseRepository = require('./baseRepository');
const Subject = require('../models/Subject');

class SubjectRepository extends BaseRepository {
    constructor() {
        super(Subject);
    }

    async findByCategory(category) {
        return await this.findAll(
            { category, status: 'active' },
            { sort: { display_order: 1 } }
        );
    }

    async findKeyStage1() {
        return await this.findByCategory('key_stage_1');
    }

    async findKeyStage2() {
        return await this.findByCategory('key_stage_2');
    }

    async findAllForAdmin(filter = {}) {
        return await this.findAll(filter, { sort: { display_order: 1, createdAt: -1 } });
    }
}

module.exports = new SubjectRepository();