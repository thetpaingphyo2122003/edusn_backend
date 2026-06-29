require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const seedHistory = require('./seed/seeders/history');

const run = async () => {
  await connectDB();
  console.log('Seeding school history from static HTML (edusn.co.uk)...');

  const count = await seedHistory();

  console.log(`Done. ${count} history slides are in the database.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('History seed failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
