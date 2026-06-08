// src/repositories/blogRepository.js
const BaseRepository = require('./baseRepository');
const Blog = require('../models/Blog');

class BlogRepository extends BaseRepository {
    constructor() {
        super(Blog);
    }

    /**
     * Slug နဲ့ Blog ကိုရှာဖွေခြင်း
     */
    async findBySlug(slug) {
        return await this.findOne({ slug });
    }

    /**
     * Published Blog များရှာဖွေခြင်း
     */
    async findPublished(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        return await this.findAll(
            { status: 'published' },
            {
                sort: { published_date: -1 },
                skip: skip,
                limit: limit,
                populate: 'author'
            }
        );
    }

    /**
     * Get ALL blogs for admin (includes published, draft, archived)
     */
    async findAllForAdmin(filter = {}) {
        return await this.findAll(filter, { sort: { createdAt: -1 } });
    }

    /**
     * Get blogs by status
     */
    async findByStatus(status) {
        return await this.findAll({ status }, { sort: { createdAt: -1 } });
    }

    /**
     * စာရေးဆရာအလိုက် Blog များရှာဖွေခြင်း
     */
    async findByAuthor(authorId) {
        return await this.findAll(
            { author: authorId },
            { sort: { created_at: -1 } }
        );
    }

    /**
     * အမျိုးအစားအလိုက် Blog များရှာဖွေခြင်း
     */
    async findByCategory(category, limit = 10) {
        return await this.findAll(
            { category, status: 'published' },
            { sort: { published_date: -1 }, limit: limit }
        );
    }

    /**
     * Tag အလိုက် Blog များရှာဖွေခြင်း
     */
    async findByTag(tag) {
        return await this.findAll(
            { tags: tag, status: 'published' },
            { sort: { published_date: -1 } }
        );
    }

    /**
     * ကြည့်ရှုသူအရေအတွက်တိုးခြင်း
     */
    async incrementViewCount(id) {
        return await this.updateById(id, { $inc: { view_count: 1 } });
    }

    /**
     * Like အရေအတွက်တိုးခြင်း
     */
    async incrementLikeCount(id) {
        return await this.updateById(id, { $inc: { like_count: 1 } });
    }

    /**
     * နောက်ဆုံး Blog များရှာဖွေခြင်း
     */
    async findRecent(limit = 5) {
        return await this.findAll(
            { status: 'published' },
            { sort: { published_date: -1 }, limit: limit }
        );
    }

    /**
     * လူကြည့်အများဆုံး Blog များရှာဖွေခြင်း
     */
    async findPopular(limit = 5) {
        return await this.findAll(
            { status: 'published' },
            { sort: { view_count: -1 }, limit: limit }
        );
    }

    /**
     * Blog များကိုရှာဖွေခြင်း (title နဲ့ content)
     */
    async search(keyword) {
        return await this.model.find(
            {
                $text: { $search: keyword },
                status: 'published'
            },
            { score: { $meta: 'textScore' } }
        ).sort({ score: { $meta: 'textScore' } });
    }

    /**
     * ဆက်စပ် Blog များရှာဖွေခြင်း
     */
    async findRelated(id, tags, limit = 3) {
        return await this.findAll(
            {
                _id: { $ne: id },
                tags: { $in: tags },
                status: 'published'
            },
            { sort: { published_date: -1 }, limit: limit }
        );
    }

    /**
     * နှစ်အလိုက် Blog များရှာဖွေခြင်း
     */
    async findByYear(year) {
        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${year}-12-31`);
        return await this.findAll({
            published_date: { $gte: startDate, $lte: endDate },
            status: 'published'
        });
    }

    /**
     * Publish a blog
     */
    async publish(id) {
        return await this.updateById(id, { 
            status: 'published', 
            published_date: new Date() 
        });
    }

    /**
     * Unpublish a blog (set to draft)
     */
    async unpublish(id) {
        return await this.updateById(id, { 
            status: 'draft', 
            published_date: null 
        });
    }
}

module.exports = new BlogRepository();