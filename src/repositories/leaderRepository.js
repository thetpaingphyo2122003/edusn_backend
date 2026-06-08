// src/repositories/leaderRepository.js
const BaseRepository = require('./baseRepository');
const Leader = require('../models/Leader');

class LeaderRepository extends BaseRepository {
    constructor() {
        super(Leader);
    }

    async findAllActive() {
        return await this.findAll(
            { status: 'active' },
            { sort: { display_order: 1 } }
        );
    }

    async findAllLeaders() {
        return await this.findAll(
            {},
            { sort: { display_order: 1, createdAt: -1 } }
        );
    }

    async findByPosition(position) {
        return await this.findAll({ position, status: 'active' });
    }
}

module.exports = new LeaderRepository();        