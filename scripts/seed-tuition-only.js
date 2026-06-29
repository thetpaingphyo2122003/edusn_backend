require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const seedTuition = require('./seed/seeders/tuition');

const run = async () => {
  await connectDB();
  console.log('Seeding tuition & pricing from static HTML (edusn.co.uk)...');

  const count = await seedTuition();

  console.log(`Done. ${count} tuition fee records are in the database.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Tuition seed failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
