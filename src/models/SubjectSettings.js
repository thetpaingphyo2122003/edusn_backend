const mongoose = require('mongoose');

const keyStageBlock = {
    breadcrumb_title: 'Primary School',
    page_title: 'Key Stage 1',
    age_range: '5 - 7 Years',
    description: 'Affordable Distance Learning Courses at EDUSN International School.',
};

const subjectSettingsSchema = new mongoose.Schema({
    key_stage_1: {
        type: {
            breadcrumb_title: { type: String, default: 'Primary School' },
            page_title: { type: String, default: 'Key Stage 1' },
            age_range: { type: String, default: '5 - 7 Years' },
            description: { type: String, default: 'Affordable Distance Learning Courses at EDUSN International School.' },
        },
        default: () => ({ ...keyStageBlock }),
    },
    key_stage_2: {
        type: {
            breadcrumb_title: { type: String, default: 'Primary School' },
            page_title: { type: String, default: 'Key Stage 2' },
            age_range: { type: String, default: '7 - 11 Years' },
            description: { type: String, default: "Advance your child's education with our Key Stage 2 curriculum." },
        },
        default: () => ({
            breadcrumb_title: 'Primary School',
            page_title: 'Key Stage 2',
            age_range: '7 - 11 Years',
            description: "Advance your child's education with our Key Stage 2 curriculum.",
        }),
    },
    lower_secondary: {
        type: {
            breadcrumb_title: { type: String, default: 'Secondary School' },
            page_title: { type: String, default: 'Lower Secondary' },
            description: { type: String, default: 'Affordable Distance Learning Courses at EDUSN International School.' },
        },
        default: () => ({
            breadcrumb_title: 'Secondary School',
            page_title: 'Lower Secondary',
            description: 'Affordable Distance Learning Courses at EDUSN International School.',
        }),
    },
    upper_secondary: {
        type: {
            breadcrumb_title: { type: String, default: 'Secondary School' },
            page_title: { type: String, default: 'Upper Secondary (IGCSE)' },
            description: { type: String, default: 'Affordable Distance Learning Courses at EDUSN International School.' },
        },
        default: () => ({
            breadcrumb_title: 'Secondary School',
            page_title: 'Upper Secondary (IGCSE)',
            description: 'Affordable Distance Learning Courses at EDUSN International School.',
        }),
    },
}, { timestamps: true });

module.exports = mongoose.model('SubjectSettings', subjectSettingsSchema);
