// src/repositories/testimonialRepository.js
const BaseRepository = require('./baseRepository');
const Testimonial = require('../models/Testimonial');

class TestimonialRepository extends BaseRepository {
    constructor() {
        super(Testimonial);
    }

    // Get only approved testimonials (for public)
    async findApproved(limit = 6) {
        return await this.findAll(
            { status: 'approved' },
            { sort: { display_order: 1 }, limit: limit }
        );
    }

    // Get ALL testimonials (for admin) - no status filter
    async findAllTestimonials() {
        return await this.findAll(
            {},
            { sort: { createdAt: -1, display_order: 1 } }
        );
    }

    async findPending() {
        return await this.findAll(
            { status: 'pending' },
            { sort: { created_at: -1 } }
        );
    }

    async approve(id) {
        return await this.updateById(id, { status: 'approved' });
    }

    async reject(id) {
        return await this.updateById(id, { status: 'rejected' });
    }

    async findByRole(role) {
        return await this.findAll(
            { role, status: 'approved' },
            { sort: { display_order: 1 } }
        );
    }

    async findByRating(minRating = 4) {
        return await this.findAll(
            { rating: { $gte: minRating }, status: 'approved' },
            { sort: { rating: -1 } }
        );
    }

    async countByStatus() {
        const [pending, approved, rejected] = await Promise.all([
            this.count({ status: 'pending' }),
            this.count({ status: 'approved' }),
            this.count({ status: 'rejected' })
        ]);
        
        return { pending, approved, rejected };
    }
}

module.exports = new TestimonialRepository();   