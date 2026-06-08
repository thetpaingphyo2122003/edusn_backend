const BaseRepository = require('./baseRepository');
const IgcseCourse = require('../models/IgcseCourse');

class IgcseCourseRepository extends BaseRepository {
    constructor() {
        super(IgcseCourse);
    }

    async findBySlug(slug) {
        return await this.findOne({ slug, status: 'active' });
    }

    async findByCategory(category) {
        return await this.findAll(
            { category, status: 'active' },
            { sort: { display_order: 1 } }
        );
    }

    async findIGCSE() {
        return await this.findByCategory('IGCSE');
    }

    async findALevel() {
        return await this.findByCategory('A_LEVEL');
    }

    async findAllCourses(query = {}) {
        return await this.model.find(query).sort({ display_order: 1, createdAt: -1 });
    }

    async updateOrder(id, display_order) {
        return await this.updateById(id, { display_order });
    }
}

module.exports = new IgcseCourseRepository();