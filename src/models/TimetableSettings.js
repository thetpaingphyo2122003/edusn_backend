const mongoose = require('mongoose');

const yearSectionSchema = {
    academic_year: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '/img/content/timetable.png' },
    display_order: { type: Number, default: 0 },
};

const timetableSettingsSchema = new mongoose.Schema({
    default_description: {
        type: String,
        default: 'The daily schedule for students varies based on their year levels:',
    },
    default_image: { type: String, default: '/img/content/timetable.png' },
    year_sections: {
        type: [new mongoose.Schema(yearSectionSchema, { _id: false })],
        default: [],
    },
}, { timestamps: true });

module.exports = mongoose.model('TimetableSettings', timetableSettingsSchema);
