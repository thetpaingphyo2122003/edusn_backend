// src/repositories/partnerRepository.js
const BaseRepository = require('./baseRepository');
const Partner = require('../models/Partner');

class PartnerRepository extends BaseRepository {
    constructor() {
        super(Partner);
    }

    async findUniversities() {
        return await this.findAll(
            { type: 'university', status: 'active' },
            { sort: { display_order: 1 } }
        );
    }

    async findProgressionRoutes() {
        return await this.findAll(
            { type: 'progression_route', status: 'active' },
            { sort: { display_order: 1 } }
        );
    }

    async findByCountry(country) {
        return await this.findAll(
            { country_category: country, type: 'university', status: 'active' }
        );
    }

    async getPageInfo() {
        return await this.findOne({ type: 'page_info' });
    }

    async searchRoutes(keyword) {
        return await this.findAll(
            {
                type: 'progression_route',
                status: 'active',
                $or: [
                    { university_name: { $regex: keyword, $options: 'i' } },
                    { programme_name: { $regex: keyword, $options: 'i' } },
                    { search_tags: { $regex: keyword, $options: 'i' } }
                ]
            },
            { sort: { display_order: 1 } }
        );
    }
}

module.exports = new PartnerRepository();