const mongoose = require('mongoose');

const categorySectionSchema = new mongoose.Schema({
    award_category: { type: String, required: true },
    section_title: { type: String, default: '' },
    section_title_span: { type: String, default: 'Award' },
    subtitle_template: { type: String, default: '{title} for {year} Academic Year' },
    card_subtitle: { type: String, default: '' },
    group_by_sub_category: { type: Boolean, default: false },
    display_order: { type: Number, default: 0 },
}, { _id: false });

const defaultCategorySections = [
    {
        award_category: "Students' Favorite Teacher Award",
        section_title: "Students' Favorite Teacher",
        section_title_span: 'Award',
        subtitle_template: "Students' Favorite Teacher Award for {year} Academic Year",
        card_subtitle: "Students' Favorite Teacher Award",
        group_by_sub_category: false,
        display_order: 1,
    },
    {
        award_category: 'Best Student for each grade',
        section_title: 'Best Student for each grade',
        section_title_span: 'Award',
        subtitle_template: 'Best Student For Each Grade Level for {year} Academic Year',
        card_subtitle: 'Best Student of the Campus',
        group_by_sub_category: false,
        display_order: 2,
    },
    {
        award_category: 'Outstanding Student',
        section_title: 'Outstanding',
        section_title_span: 'Student Award',
        subtitle_template: 'Outstanding Student Award for {year} Academic Year',
        card_subtitle: 'Outstanding Student',
        group_by_sub_category: false,
        display_order: 3,
    },
    {
        award_category: 'Most-Improved Student',
        section_title: 'Most-Improved',
        section_title_span: 'Student Award',
        subtitle_template: 'Most-Improved Student Award for {year} Academic Year',
        card_subtitle: 'Most-Improved Student',
        group_by_sub_category: false,
        display_order: 4,
    },
    {
        award_category: 'Individual Student',
        section_title: 'Individual Student',
        section_title_span: 'Awards',
        subtitle_template: 'Individual Student Awards for {year} Academic Year',
        card_subtitle: '',
        group_by_sub_category: false,
        display_order: 5,
    },
    {
        award_category: 'Best Student of the Year',
        section_title: 'Best Student of the',
        section_title_span: 'Year',
        subtitle_template: 'Best Student Of {year} Academic Year',
        card_subtitle: 'Best Student of the Year',
        group_by_sub_category: false,
        display_order: 6,
    },
    {
        award_category: "Campuses' Yearly PBL Awards",
        section_title: "Campuses' Yearly PBL Awards",
        section_title_span: '',
        subtitle_template: "Campuses' Yearly PBL Awards for {year} Academic Year",
        card_subtitle: 'Project Award for PBL',
        group_by_sub_category: true,
        display_order: 7,
    },
];

const awardSettingsSchema = new mongoose.Schema({
    breadcrumb_title: { type: String, default: 'Awards' },
    default_academic_year: { type: String, default: '2022-2023' },
    page_intro: { type: String, default: '' },
    category_sections: {
        type: [categorySectionSchema],
        default: () => defaultCategorySections,
    },
}, { timestamps: true });

module.exports = mongoose.model('AwardSettings', awardSettingsSchema);
module.exports.defaultCategorySections = defaultCategorySections;
