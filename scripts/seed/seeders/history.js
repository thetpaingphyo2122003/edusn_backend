const History = require('../../../src/models/History');
const { parseHistory } = require('../parsers/history');

const seedHistory = async () => {
  const { timeline } = parseHistory();

  await History.deleteMany({ type: 'timeline' });
  await History.insertMany(timeline);

  console.log(`  history: ${timeline.length} timeline slides`);
  return timeline.length;
};

module.exports = seedHistory;
