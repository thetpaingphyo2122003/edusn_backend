const Timetable = require('../../../src/models/Timetable');
const TimetableSettings = require('../../../src/models/TimetableSettings');
const { parseTimetable } = require('../parsers/timetable');

const upsertPageSettings = async (settings) => {
  const existing = await TimetableSettings.findOne();
  if (!existing) {
    await TimetableSettings.create(settings);
    return;
  }

  existing.default_description = settings.default_description;
  existing.default_image = settings.default_image;
  existing.year_sections = settings.year_sections;
  await existing.save();
};

const seedTimetable = async () => {
  const { settings, entries } = parseTimetable();

  await Timetable.deleteMany({});
  await Timetable.insertMany(entries);
  await upsertPageSettings(settings);

  const yearCounts = entries.reduce((acc, entry) => {
    acc[entry.academic_year] = (acc[entry.academic_year] || 0) + 1;
    return acc;
  }, {});

  console.log(`  Timetable entries: ${entries.length} (from static HTML)`);
  Object.entries(yearCounts).forEach(([year, count]) => {
    console.log(`    - ${year}: ${count} cells`);
  });

  return entries.length;
};

module.exports = {
  seedTimetable,
  upsertPageSettings,
};
