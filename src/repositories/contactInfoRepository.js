// src/repositories/contactInfoRepository.js
const BaseRepository = require('./baseRepository');
const ContactInfo = require('../models/ContactInfo');

class ContactInfoRepository extends BaseRepository {
    constructor() {
        super(ContactInfo);
    }

    // ✅ For admin - get ALL campuses (both active and inactive)
    async findAllCampuses() {
        return await this.findAll(
            { type: 'campus' },  // Remove status filter
            { sort: { display_order: 1 } }
        );
    }

    // ✅ For admin - get ALL offices (both active and inactive)
    async findAllOffices() {
        return await this.findAll(
            { type: 'office' },  // Remove status filter
            { sort: { display_order: 1 } }
        );
    }

    // ✅ For public - get ONLY active campuses
    async findActiveCampuses() {
        return await this.findAll(
            { type: 'campus', status: 'active' },
            { sort: { display_order: 1 } }
        );
    }

    // ✅ For public - get ONLY active offices
    async findActiveOffices() {
        return await this.findAll(
            { type: 'office', status: 'active' },
            { sort: { display_order: 1 } }
        );
    }

    // Keep original for backward compatibility (or remove)
    async findCampuses() {
        return await this.findAllCampuses(); // Now returns all
    }

    async findOffices() {
        return await this.findAllOffices(); // Now returns all
    }

    async findByName(name) {
        return await this.findOne({ name, status: 'active' });
    }

    // ✅ Find by status (for filtering)
    async findByStatus(status) {
        return await this.findAll(
            { status: status },
            { sort: { display_order: 1 } }
        );
    }

    // ✅ Get all contacts (for admin)
    async findAllContacts() {
        return await this.findAll(
            {},
            { sort: { display_order: 1 } }
        );
    }
}

module.exports = new ContactInfoRepository();               