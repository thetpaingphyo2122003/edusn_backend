// src/repositories/faqRepository.js
const BaseRepository = require('./baseRepository');
const Faq = require('../models/Faq');

class FaqRepository extends BaseRepository {
    constructor() {
        super(Faq);
    }

    // ✅ Get ALL FAQs (for admin) - no status filter
    async findAllFaqs() {
        return await this.findAll(
            { type: 'faq' },
            { sort: { category: 1, display_order: 1, createdAt: -1 } }
        );
    }

    async findActiveFaqs() {
        return await this.findAll(
            { type: 'faq', status: 'active' },
            { sort: { category: 1, display_order: 1 } }
        );
    }

    async findByCategory(category) {
        return await this.findAll(
            { category, type: 'faq', status: 'active' },
            { sort: { display_order: 1 } }
        );
    }

    async getPageInfo() {
        return await this.findOne({ type: 'page_info' });
    }

    async search(keyword) {
        return await this.model.find(
            {
                $text: { $search: keyword },
                type: 'faq',
                status: 'active'
            }
        );
    }
}

module.exports = new FaqRepository();