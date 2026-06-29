const IgcseCourse = require('../../../src/models/IgcseCourse');
const IgcseCourseSettings = require('../../../src/models/IgcseCourseSettings');
const { parseIgcseCourses } = require('../parsers/igcseCourses');

const upsertPageSettings = async () => {
  const payload = {
    parent_breadcrumb_title: 'IGCSE',
    parent_breadcrumb_path: '/igcse',
    show_parent_in_breadcrumb: true,
  };

  const existing = await IgcseCourseSettings.findOne();
  if (!existing) {
    await IgcseCourseSettings.create(payload);
    return;
  }

  existing.parent_breadcrumb_title = payload.parent_breadcrumb_title;
  existing.parent_breadcrumb_path = payload.parent_breadcrumb_path;
  existing.show_parent_in_breadcrumb = payload.show_parent_in_breadcrumb;
  await existing.save();
};

const seedIgcseCourses = async () => {
  const parsed = parseIgcseCourses();
  if (!parsed.length) {
    throw new Error('No IGCSE courses parsed from static HTML');
  }

  await IgcseCourse.deleteMany({ category: 'IGCSE' });
  await IgcseCourse.insertMany(parsed);
  await upsertPageSettings();

  console.log(`  IGCSE courses: ${parsed.length} (from static HTML)`);
  return parsed.length;
};

module.exports = {
  seedIgcseCourses,
  upsertPageSettings,
};
