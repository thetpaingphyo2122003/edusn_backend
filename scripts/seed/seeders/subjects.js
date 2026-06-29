const Subject = require('../../../src/models/Subject');
const SubjectSettings = require('../../../src/models/SubjectSettings');
const { SUBJECTS_FALLBACK } = require('../data/subjectsFallback');
const {
  parseKeyStageSubjects,
  parseKeyStagePageSettings,
} = require('../parsers/keyStageSubjects');
const {
  parseSecondarySubjects,
  parseSecondaryPageSettings,
} = require('../parsers/secondarySubjects');

const withDefaults = (item) => ({
  year: null,
  description: null,
  content: null,
  image: null,
  status: 'active',
  ...item,
});

const upsertPageSettings = async () => {
  const keyStageSettings = parseKeyStagePageSettings();
  const secondarySettings = parseSecondaryPageSettings();
  const settings = { ...keyStageSettings, ...secondarySettings };
  const existing = await SubjectSettings.findOne();

  if (!existing) {
    await SubjectSettings.create(settings);
    return;
  }

  existing.key_stage_1 = {
    ...(existing.key_stage_1?.toObject?.() || existing.key_stage_1 || {}),
    ...settings.key_stage_1,
  };
  existing.key_stage_2 = {
    ...(existing.key_stage_2?.toObject?.() || existing.key_stage_2 || {}),
    ...settings.key_stage_2,
  };
  existing.lower_secondary = {
    ...(existing.lower_secondary?.toObject?.() || existing.lower_secondary || {}),
    ...settings.lower_secondary,
  };
  existing.upper_secondary = {
    ...(existing.upper_secondary?.toObject?.() || existing.upper_secondary || {}),
    ...settings.upper_secondary,
  };
  await existing.save();
};

const seedKeyStageSubjects = async () => {
  const parsed = parseKeyStageSubjects();
  if (!parsed.length) {
    throw new Error('No key stage subjects parsed from static HTML');
  }

  await Subject.deleteMany({ category: { $in: ['key_stage_1', 'key_stage_2'] } });
  await Subject.insertMany(parsed);
  console.log(`  key stage subjects: ${parsed.length} (from static HTML)`);
  return parsed.length;
};

const seedSecondarySubjects = async () => {
  const parsed = parseSecondarySubjects();
  if (!parsed.length) {
    throw new Error('No secondary subjects parsed from static HTML');
  }

  await Subject.deleteMany({ category: { $in: ['lower_secondary', 'upper_secondary'] } });
  await Subject.insertMany(parsed);
  console.log(`  secondary subjects: ${parsed.length} (from static HTML)`);
  return parsed.length;
};

const seedSubjects = async () => {
  try {
    await seedKeyStageSubjects();
  } catch (error) {
    console.warn(`  key stage HTML parse failed (${error.message}), using fallback records`);
    await Subject.deleteMany({ category: { $in: ['key_stage_1', 'key_stage_2'] } });
    const fallback = SUBJECTS_FALLBACK.filter((item) =>
      ['key_stage_1', 'key_stage_2'].includes(item.category)
    ).map(withDefaults);
    await Subject.insertMany(fallback);
    console.log(`  key stage subjects: ${fallback.length} (fallback)`);
  }

  try {
    await seedSecondarySubjects();
  } catch (error) {
    console.warn(`  secondary HTML parse failed (${error.message}), using fallback records`);
    await Subject.deleteMany({ category: { $in: ['lower_secondary', 'upper_secondary'] } });
    const fallback = SUBJECTS_FALLBACK.filter((item) =>
      ['lower_secondary', 'upper_secondary'].includes(item.category)
    ).map(withDefaults);
    if (fallback.length) {
      await Subject.insertMany(fallback);
      console.log(`  secondary subjects: ${fallback.length} (fallback)`);
    }
  }

  await upsertPageSettings();
};

module.exports = seedSubjects;
module.exports.seedKeyStageSubjects = seedKeyStageSubjects;
module.exports.seedSecondarySubjects = seedSecondarySubjects;
module.exports.upsertPageSettings = upsertPageSettings;
