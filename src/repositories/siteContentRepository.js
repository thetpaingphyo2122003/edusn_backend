// src/repositories/siteContentRepository.js
const BaseRepository = require('./baseRepository');
const SiteContent = require('../models/SiteContent');

class SiteContentRepository extends BaseRepository {
    constructor() {
        super(SiteContent);
    }

    async getHero() {
        return await this.findOne({ section_key: 'hero' });
    }

    async getAbout() {
        return await this.findOne({ section_key: 'about' });
    }

    async getCulture() {
        return await this.findOne({ section_key: 'culture' });
    }

    async getMission() {
        return await this.findOne({ section_key: 'mission' });
    }

    async getStatistics() {
        return await this.findOne({ section_key: 'statistics' });
    }

    async getAttendingVirtually() {
        return await this.findOne({ section_key: 'attending_virtually' });
    }

    async getAllSections() {
        return await this.findAll({});
    }

    async updateByKey(key, data) {
        return await this.model.findOneAndUpdate(
            { section_key: key },
            { $set: data },
            { 
                new: true, 
                upsert: true,
                returnDocument: 'after'
            }
        );
    }

    async deleteByKey(key) {
        return await this.model.findOneAndDelete({ section_key: key });
    }
}

module.exports = new SiteContentRepository();