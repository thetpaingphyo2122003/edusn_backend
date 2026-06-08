const Notification = require('../models/Notification');

class NotificationService {
    /**
     * Create a notification
     * @param {Object} data - Notification data
     * @returns {Promise<Object>} Created notification
     */
    static async create(data) {
        try {
            const notification = new Notification({
                type: data.type,
                title: data.title,
                message: data.message,
                link: data.link,
                reference_id: data.reference_id || null,
                reference_model: data.reference_model || null,
                created_by: data.created_by || null,
                read: false
            });
            
            await notification.save();
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            return null;
        }
    }

    /**
     * Create notification for new blog post
     * @param {Object} blog - Blog object
     * @param {string} userId - User ID who created
     */
    static async blogCreated(blog, userId) {
        return await this.create({
            type: 'blog',
            title: 'New Blog Post Published',
            message: `A new blog post "${blog.title}" has been published.`,
            link: '/admin/blog',
            reference_id: blog._id,
            reference_model: 'Blog',
            created_by: userId
        });
    }

    /**
     * Create notification for new testimonial
     * @param {Object} testimonial - Testimonial object
     * @param {string} userId - User ID who created
     */
    static async testimonialCreated(testimonial, userId) {
        return await this.create({
            type: 'testimonial',
            title: 'New Testimonial Added',
            message: `${testimonial.name} added a new testimonial with ${testimonial.rating}-star rating.`,
            link: '/admin/testimonials',
            reference_id: testimonial._id,
            reference_model: 'Testimonial',
            created_by: userId
        });
    }

    /**
     * Create notification for new award
     * @param {Object} award - Award object
     * @param {string} userId - User ID who created
     */
    static async awardCreated(award, userId) {
        const recipient = award.student_name || award.teacher_name;
        return await this.create({
            type: 'award',
            title: 'New Award Created',
            message: `A new award "${award.award_title || award.award_category}" has been awarded to ${recipient}.`,
            link: '/admin/awards',
            reference_id: award._id,
            reference_model: 'Award',
            created_by: userId
        });
    }

    /**
     * Create notification for new partner
     * @param {Object} partner - Partner object
     * @param {string} userId - User ID who created
     */
    static async partnerCreated(partner, userId) {
        return await this.create({
            type: 'partner',
            title: 'New Partner Added',
            message: `${partner.name} has been added as a new partner.`,
            link: '/admin/partners',
            reference_id: partner._id,
            reference_model: 'Partner',
            created_by: userId
        });
    }

    /**
     * Create notification for tuition update
     * @param {Object} tuition - Tuition object
     * @param {string} userId - User ID who updated
     */
    static async tuitionUpdated(tuition, userId) {
        return await this.create({
            type: 'tuition',
            title: 'Tuition Fees Updated',
            message: `Tuition fees for ${tuition.program_name || 'program'} have been updated.`,
            link: '/admin/tuition',
            reference_id: tuition._id,
            reference_model: 'Tuition',
            created_by: userId
        });
    }

    /**
     * Create notification for new user registration
     * @param {Object} user - User object
     * @param {string} userId - User ID who created
     */
    static async userRegistered(user, userId) {
        return await this.create({
            type: 'user',
            title: 'New User Registered',
            message: `A new user "${user.username}" has registered to the system.`,
            link: '/admin/users',
            reference_id: user._id,
            reference_model: 'User',
            created_by: userId
        });
    }

    /**
     * Create notification for new course
     * @param {Object} course - Course object
     * @param {string} userId - User ID who created
     */
    static async courseCreated(course, userId) {
        return await this.create({
            type: 'course',
            title: 'New Course Added',
            message: `A new course "${course.title}" has been added to ${course.category}.`,
            link: '/admin/igcse-courses',
            reference_id: course._id,
            reference_model: 'IgcseCourse',
            created_by: userId
        });
    }

    /**
     * Create notification for new leader
     * @param {Object} leader - Leader object
     * @param {string} userId - User ID who created
     */
    static async leaderCreated(leader, userId) {
        return await this.create({
            type: 'leadership',
            title: 'New Leader Added',
            message: `${leader.name} has been added as ${leader.position}.`,
            link: '/admin/leaders',
            reference_id: leader._id,
            reference_model: 'Leader',
            created_by: userId
        });
    }

    /**
     * Create notification for new FAQ
     * @param {Object} faq - FAQ object
     * @param {string} userId - User ID who created
     */
    static async faqCreated(faq, userId) {
        return await this.create({
            type: 'faq',
            title: 'New FAQ Added',
            message: `A new FAQ "${faq.question.substring(0, 50)}..." has been added.`,
            link: '/admin/faq',
            reference_id: faq._id,
            reference_model: 'Faq',
            created_by: userId
        });
    }

    /**
     * Create notification for history update
     * @param {Object} history - History object
     * @param {string} userId - User ID who created
     */
    static async historyCreated(history, userId) {
        return await this.create({
            type: 'history',
            title: 'History Timeline Updated',
            message: `A new milestone "${history.title}" has been added to school history.`,
            link: '/admin/history',
            reference_id: history._id,
            reference_model: 'History',
            created_by: userId
        });
    }

    /**
     * Create notification for content update
     * @param {string} sectionKey - Section key
     * @param {string} userId - User ID who updated
     */
    static async contentUpdated(sectionKey, userId) {
        const sectionNames = {
            hero: 'Hero',
            about: 'About',
            culture: 'Culture',
            statistics: 'Statistics',
            attending_virtually: 'Attending Virtually'
        };
        
        return await this.create({
            type: 'content',
            title: 'Site Content Updated',
            message: `${sectionNames[sectionKey] || sectionKey} section content has been updated.`,
            link: '/admin/site-content',
            created_by: userId
        });
    }
}

module.exports = NotificationService;