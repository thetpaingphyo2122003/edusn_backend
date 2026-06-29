require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const {
  seedSecondarySubjects,
  upsertPageSettings,
} = require('./seed/seeders/subjects');

const run = async () => {
  await connectDB();
  console.log('Seeding secondary subjects from static HTML (edusn.co.uk)...');

  const count = await seedSecondarySubjects();
  await upsertPageSettings();

  console.log(`Done. ${count} secondary subject records are in the database.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Secondary subject seed failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
