require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const {
  seedKeyStageSubjects,
  upsertPageSettings,
} = require('./seed/seeders/subjects');

const run = async () => {
  await connectDB();
  console.log('Seeding Key Stage subjects from static HTML (edusn.co.uk)...');

  const count = await seedKeyStageSubjects();
  await upsertPageSettings();

  console.log(`Done. ${count} key stage subject records are in the database.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Key stage subject seed failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
