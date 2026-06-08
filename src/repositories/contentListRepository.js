// src/repositories/contentListRepository.js
const BaseRepository = require('./baseRepository');
const ContentList = require('../models/ContentList');

class ContentListRepository extends BaseRepository {
    constructor() {
        super(ContentList);
    }

    async findByParentSection(section) {
        return await this.findAll(
            { parent_section: section, status: 'active' },
            { sort: { display_order: 1 } }
        );
    }

    async getMissions() {
        return await this.findByParentSection('missions');
    }

    async getOffices() {
        return await this.findByParentSection('offices');
    }

    async getPathway() {
        return await this.findByParentSection('pathway');
    }

    async getQuickLinks() {
        return await this.findByParentSection('quick_links');
    }

    // ✅ Get all content for admin (including inactive)
    async findAllContent() {
        return await this.findAll({}, { sort: { parent_section: 1, display_order: 1 } });
    }
}

module.exports = new ContentListRepository();