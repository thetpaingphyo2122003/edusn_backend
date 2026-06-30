const Award = require('../../../src/models/Award');
const AwardSettings = require('../../../src/models/AwardSettings');
const { defaultCategorySections } = require('../../../src/models/AwardSettings');
const { parseAwards } = require('../parsers/awards');

const upsertPageSettings = async (settings) => {
  const existing = await AwardSettings.findOne();
  const payload = {
    breadcrumb_title: settings.breadcrumb_title || 'Awards',
    default_academic_year: settings.default_academic_year || '2022-2023',
    page_intro: settings.page_intro || '',
    category_sections: defaultCategorySections,
  };

  if (!existing) {
    await AwardSettings.create(payload);
    return;
  }

  existing.breadcrumb_title = payload.breadcrumb_title;
  existing.default_academic_year = payload.default_academic_year;
  existing.page_intro = payload.page_intro;
  if (!existing.category_sections?.length) {
    existing.category_sections = payload.category_sections;
  }
  await existing.save();
};

const seedAwards = async ({
  htmlFile,
  forceAcademicYear,
  updateDefaultYear = true,
} = {}) => {
  const { settings, entries, academicYear } = parseAwards({ htmlFile, forceAcademicYear });

  await Award.deleteMany({ academic_year: academicYear });
  await Award.insertMany(entries);

  if (updateDefaultYear) {
    await upsertPageSettings(settings);
  }

  const categoryCounts = entries.reduce((acc, entry) => {
    const key = entry.sub_category
      ? `${entry.award_category} (${entry.sub_category})`
      : entry.award_category;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log(`  awards: ${entries.length} (from static HTML, ${academicYear})`);
  Object.entries(categoryCounts).forEach(([category, count]) => {
    console.log(`    - ${category}: ${count}`);
  });

  return entries.length;
};

module.exports = {
  seedAwards,
  upsertPageSettings,
};
