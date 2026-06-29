require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');

const seedUsers = require('./seed/seeders/users');
const seedSiteContent = require('./seed/seeders/siteContent');
const seedContentLists = require('./seed/seeders/contentLists');
const seedLeaders = require('./seed/seeders/leaders');
const seedPartners = require('./seed/seeders/partners');
const seedFaqs = require('./seed/seeders/faqs');
const seedContact = require('./seed/seeders/contact');
const seedTuition = require('./seed/seeders/tuition');
const seedBlog = require('./seed/seeders/blog');
const seedTestimonials = require('./seed/seeders/testimonials');
const seedSubjects = require('./seed/seeders/subjects');
const seedIgcseCourses = require('./seed/seeders/igcseCourses');
const seedALevelCourses = require('./seed/seeders/aLevelCourses');
const { seedTimetable } = require('./seed/seeders/timetable');
const { seedAwards } = require('./seed/seeders/awards');
const seedHistory = require('./seed/seeders/history');

const seeders = [
  ['users', seedUsers],
  ['site content', seedSiteContent],
  ['content lists', seedContentLists],
  ['leaders', seedLeaders],
  ['study abroad partners', seedPartners],
  ['faqs', seedFaqs],
  ['contact', seedContact],
  ['tuition', seedTuition],
  ['subjects', seedSubjects],
  ['IGCSE courses', seedIgcseCourses.seedIgcseCourses],
  ['AS/A Level courses', seedALevelCourses.seedALevelCourses],
  ['timetable', seedTimetable],
  ['awards', seedAwards],
  ['history', seedHistory],
  ['blog', seedBlog],
  ['testimonials', seedTestimonials],
];

const run = async () => {
  await connectDB();
  console.log('Seeding database from static HTML (edusn.co.uk)...');

  for (const [, seeder] of seeders) {
    await seeder();
  }

  console.log('Seed completed successfully.');
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Seed failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
