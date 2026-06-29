const Leader = require('../../../src/models/Leader');
const { loadHtml } = require('../lib/html');
const { cleanText, normalizeAssetPath } = require('../lib/utils');

const seedLeaders = async () => {
  const $ = loadHtml('index.html');
  const docs = [];

  $('.instructor-item').each((index, el) => {
    const item = $(el);
    const name = cleanText(item.find('h4').text());
    if (!name) return;

    docs.push({
      name,
      position: cleanText(item.find('.instructor-tag').text()) || 'Leader',
      qualification: cleanText(item.find('p').first().text()) || null,
      photo: normalizeAssetPath(item.find('img').attr('src')),
      email: null,
      display_order: index + 1,
      status: 'active',
    });
  });

  if (!docs.length) {
    docs.push(
      {
        name: 'Ms. Sandra',
        position: 'Director of Studies',
        qualification: 'M.S( Science ), UARK M.A (TEFL), UIE M.Sc( Science), UY',
        photo: '/assets/img/edusnleader/mssandra33.jpg',
        email: 'sandra@edusn.co.uk',
        display_order: 1,
        status: 'active',
      },
      {
        name: 'Mr. Thiha Win',
        position: 'Principal',
        qualification: 'Honorable Doctorate Leadership and educational management (Rajabhat University)',
        photo: '/assets/img/edusnleader/mrthihawin11.jpg',
        email: 'thiha.win@edusn.co.uk',
        display_order: 2,
        status: 'active',
      }
    );
  }

  await Leader.insertMany(docs);
  console.log(`  leaders: ${docs.length}`);
};

module.exports = seedLeaders;
