const ContentList = require('../../../src/models/ContentList');
const { loadHtml } = require('../lib/html');
const { cleanText, normalizeAssetPath } = require('../lib/utils');

const parsePathwayYears = ($, block) => {
  const years = [];
  $(block)
    .find('p')
    .each((_, p) => {
      const $p = $(p);
      const yearLabel = cleanText($p.find('.fw-bold').first().text());
      if (!yearLabel || !/year/i.test(yearLabel)) return;

      const ageText = cleanText($p.text().replace(yearLabel, ''));
      const age = ageText.replace(/^AGE\s*/i, '').trim();

      years.push({
        year: yearLabel,
        age,
      });
    });
  return years;
};

const seedContentLists = async () => {
  const $ = loadHtml('index.html');
  const docs = [];

  $('.step-area .step-item').each((index, el) => {
    const item = $(el);
    docs.push({
      parent_section: 'missions',
      display_order: index + 1,
      title: cleanText(item.find('h3').text()),
      description: cleanText(item.find('p').text()),
      status: 'active',
      extra_data: {
        step_number: cleanText(item.find('.step-count span').text()) || String(index + 1).padStart(2, '0') + '.',
        video_url: index === 0 ? $('.step-area .popup-youtube').attr('href') || null : null,
      },
    });
  });

  $('.feature-area .feature-item').each((index, el) => {
    const item = $(el);
    const col = item.closest('[data-bs-content]');
    docs.push({
      parent_section: 'offices',
      display_order: index + 1,
      title: cleanText(item.find('h4').text()),
      description: cleanText(col.attr('data-bs-content') || item.find('h4').text()),
      image: normalizeAssetPath(item.find('img').attr('src')),
      icon: normalizeAssetPath(item.find('img').attr('src')),
      status: 'active',
      extra_data: {
        location: cleanText(col.attr('data-bs-content') || ''),
      },
    });
  });

  $('.timeline ul li').each((index, el) => {
    const item = $(el);
    const stage = cleanText(item.find('time').first().text());
    const years = parsePathwayYears($, item);
    const ageRange = cleanText(item.find('p').last().text());
    docs.push({
      parent_section: 'pathway',
      display_order: index + 1,
      title: stage,
      description: ageRange,
      status: 'active',
      extra_data: {
        years,
        age_range: ageRange,
      },
    });
  });

  await ContentList.deleteMany({ parent_section: { $in: ['missions', 'offices', 'pathway'] } });
  await ContentList.insertMany(docs);
  console.log(`  content lists: ${docs.length}`);
};

module.exports = seedContentLists;
