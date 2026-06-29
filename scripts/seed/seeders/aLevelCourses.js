const IgcseCourse = require('../../../src/models/IgcseCourse');
const IgcseCourseSettings = require('../../../src/models/IgcseCourseSettings');
const { parseALevelCourses } = require('../parsers/igcseCourses');

const seedALevelCourses = async () => {
  const parsed = parseALevelCourses();
  if (!parsed.length) {
    throw new Error('No AS/A Level courses parsed from static HTML');
  }

  await IgcseCourse.deleteMany({ category: { $in: ['AS_A_LEVEL', 'A_LEVEL'] } });
  await IgcseCourse.insertMany(parsed);

  console.log(`  AS/A Level courses: ${parsed.length} (from static HTML)`);
  parsed.forEach((course) => {
    console.log(`    - ${course.title} (${course.slug}, ${course.tabs?.length || 0} tabs)`);
  });
  return parsed.length;
};

module.exports = {
  seedALevelCourses,
};
