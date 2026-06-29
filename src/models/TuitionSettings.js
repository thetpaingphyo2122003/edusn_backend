const mongoose = require('mongoose');

const categorySettingsSchema = new mongoose.Schema({
    breadcrumb_title: { type: String, default: 'Tuition & Fees' },
    breadcrumb_active: { type: String, default: '' },
    page_heading: { type: String, default: 'Payment Plan for 2026-27 Academic Year' },
    page_subtitle: { type: String, default: '' },
    intro_text: { type: String, default: '' },
    show_currency_selector: { type: Boolean, default: true },
    currency_intro_heading: { type: String, default: '' },
    currency_intro_text: { type: String, default: '' },
    installment_note: { type: String, default: '' },
    secondary_fee_label: { type: String, default: 'Material Fees' },
    secondary_fee_field: {
        type: String,
        enum: ['material', 'microsoft', 'none'],
        default: 'material',
    },
}, { _id: false });

const defaultCategorySettings = {
    campus: {
        breadcrumb_title: 'Tuition & Fees',
        breadcrumb_active: 'Campus Fees',
        page_heading: 'Payment Plan for 2026-27 Academic Year',
        page_subtitle: '(For Fully Campus)',
        intro_text: '',
        show_currency_selector: true,
        currency_intro_heading: '',
        currency_intro_text: '',
        installment_note: 'Installment plans available for all year levels.',
        secondary_fee_label: 'Material Fees',
        secondary_fee_field: 'material',
    },
    virtual: {
        breadcrumb_title: 'Tuition & Fees',
        breadcrumb_active: 'Tuition & Fees',
        page_heading: 'Payment Plan for 2026-27 Academic Year',
        page_subtitle: '(For virtual only)',
        intro_text: '',
        show_currency_selector: true,
        currency_intro_heading: 'Currency Display',
        currency_intro_text: 'Comparison with other IS , the price is still comfortable and reasonable.',
        installment_note: '',
        secondary_fee_label: 'Microsoft Teams license fees',
        secondary_fee_field: 'microsoft',
    },
    gcse_a_level: {
        breadcrumb_title: 'IGCSE O Level Fees',
        breadcrumb_active: 'IGCSE Fees',
        page_heading: 'IGCSE O Level & A Level Fees',
        page_subtitle: '',
        intro_text: '',
        show_currency_selector: false,
        currency_intro_heading: '',
        currency_intro_text: '',
        installment_note: 'Subsequent installments (2nd, 3rd, and 4th) must be paid every two months following the initial payment.',
        secondary_fee_label: 'Material Fees',
        secondary_fee_field: 'material',
    },
};

const tuitionSettingsSchema = new mongoose.Schema({
    campus: { type: categorySettingsSchema, default: () => ({ ...defaultCategorySettings.campus }) },
    virtual: { type: categorySettingsSchema, default: () => ({ ...defaultCategorySettings.virtual }) },
    gcse_a_level: { type: categorySettingsSchema, default: () => ({ ...defaultCategorySettings.gcse_a_level }) },
}, { timestamps: true });

module.exports = mongoose.model('TuitionSettings', tuitionSettingsSchema);
module.exports.defaultCategorySettings = defaultCategorySettings;
