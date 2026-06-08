// src/repositories/historyRepository.js
const BaseRepository = require('./baseRepository');
const History = require('../models/History');

class HistoryRepository extends BaseRepository {
    constructor() {
        super(History);
    }

    async findTimeline() {
        return await this.findAll(
            { type: 'timeline', status: 'active' },
            { sort: { year: -1, display_order: 1 } }
        );
    }

    async findAllTimeline() {
        return await this.findAll(
            { type: 'timeline' },
            { sort: { year: -1, display_order: 1 } }
        );
    }

    async findByYear(year) {
        return await this.findOne({ year, type: 'timeline' });
    }

    async getPageInfo() {
        return await this.findOne({ type: 'page_info' });
    }
}

module.exports = new HistoryRepository();