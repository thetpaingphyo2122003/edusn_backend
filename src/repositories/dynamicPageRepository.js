const BaseRepository = require('./baseRepository');
const DynamicPage = require('../models/DynamicPage');

class DynamicPageRepository extends BaseRepository {
    constructor() {
        super(DynamicPage);
    }

    async findBySlug(slug) {
        return await this.findOne({ slug, status: 'published' });
    }

    async findByStatus(status) {
        return await this.findAll({ status }, { sort: { createdAt: -1 } });
    }

    async getPublishedPages() {
        return await this.findAll({ status: 'published' }, { sort: { createdAt: -1 } });
    }

    async getPageWithSections(pageId) {
        return await this.findById(pageId);
    }

    async updateSections(pageId, sections) {
        return await this.updateById(pageId, { sections });
    }

    async publishPage(pageId) {
        return await this.updateById(pageId, { 
            status: 'published', 
            published_at: new Date() 
        });
    }

    async duplicatePage(pageId, newName, newSlug) {
        const original = await this.findById(pageId);
        if (!original) return null;
        
        const originalObj = original.toObject();
        delete originalObj._id;
        delete originalObj.createdAt;
        delete originalObj.updatedAt;
        delete originalObj.__v;
        delete originalObj.published_at;
        
        return await this.create({
            ...originalObj,
            name: newName,
            slug: newSlug,
            status: 'draft',
            published_at: null
        });
    }

    async getPagesByTemplate(template) {
        return await this.findAll({ template, status: 'published' }, { sort: { createdAt: -1 } });
    }

    async searchPages(keyword) {
        return await this.findAll({
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { slug: { $regex: keyword, $options: 'i' } }
            ]
        }, { sort: { createdAt: -1 } });
    }
}

module.exports = new DynamicPageRepository();