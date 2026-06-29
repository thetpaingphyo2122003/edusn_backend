require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const { seedAwards } = require('./seed/seeders/awards');

const run = async () => {
  await connectDB();
  console.log('Seeding awards from static HTML (edusn.co.uk)...');

  const count = await seedAwards();

  console.log(`Done. ${count} award records are in the database.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Awards seed failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
