require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const seedFaqs = require('./seed/seeders/faqs');

const run = async () => {
  await connectDB();
  console.log('Seeding FAQ from static HTML (edusn.co.uk)...');

  const count = await seedFaqs();

  console.log(`Done. ${count} FAQ records are in the database.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('FAQ seed failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
