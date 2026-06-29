/**
 * Drop the MongoDB database configured in .env
 * Usage: CONFIRM_RESET=yes npm run db:reset
 */
require('dotenv').config();
const mongoose = require('mongoose');

const run = async () => {
  if (process.env.CONFIRM_RESET !== 'yes') {
    console.error('Refusing to reset database.');
    console.error('Run: CONFIRM_RESET=yes npm run db:reset');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const dbName = mongoose.connection.db.databaseName;
  await mongoose.connection.dropDatabase();
  console.log(`Dropped database: ${dbName}`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('Reset failed:', error.message);
  process.exit(1);
});
