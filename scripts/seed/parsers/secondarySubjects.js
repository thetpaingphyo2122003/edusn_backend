const fs = require('fs');
const cheerio = require('cheerio');
const { staticFile } = require('../lib/paths');
const { cleanText, normalizeAssetPath, extractStyleImage } = require('../lib/utils');
const { parseDetailPage, buildContentJson } = require('./keyStageSubjects');

const LOWER_YEAR_MAP = { cat1: 'year_7', cat2: 'year_8', cat3: 'year_9' };

const TITLE_DETAIL_MAP = {
  English: 'English.html',
  Mathematics: 'Mathematics.html',
  Science: 'Science.html',
  Chemistry: 'Science.html',
  Physics: 'Science.html',
  Biology: 'Science.html',
  'ICT ( CS & Coding )': 'ICT ( CS andCoding ).html',
  'Computer Science': 'ICT ( CS andCoding ).html',
  'Global Perspective': 'Global Perspectives.html',
  'Global Perspectives': 'Global Perspectives.html',
  'Art & Design': 'Art and Design.html',
  'Business Studies': 'Business IGCSE.html',
  Accounting: 'Business IGCSE.html',
};

const PROGRAMMING_DETAIL = {
  description:
    'Programming introduces learners to computational thinking, coding fundamentals, and problem-solving using technology at EDUSN International School.',
  highlights: ['Algorithms', 'Coding', 'Problem solving', 'Digital literacy'],
  pdfLink: null,
};

const getDetailFileForTitle = (title, explicitFile = null) => {
  if (explicitFile) return explicitFile;
  return TITLE_DETAIL_MAP[cleanText(title)] || null;
};

const parseListTitles = ($, root) =>
  root
    .find('ul li')
    .map((_, li) => cleanText($(li).text()))
    .get()
    .filter(Boolean);

const parseLowerSecondaryPage = () => {
  const filePath = staticFile('Lower Secondary.html');
  const $ = cheerio.load(fs.readFileSync(filePath, 'utf8'), { decodeEntities: false });
  const subjects = [];
  let displayOrder = 0;

  $('.filter-item').each((_, element) => {
    const item = $(element);
    const classAttr = item.attr('class') || '';
    const catMatch = classAttr.match(/\bcat(\d+)\b/);
    const catKey = catMatch ? `cat${catMatch[1]}` : null;
    const year = catKey ? LOWER_YEAR_MAP[catKey] : null;
    if (!year) return;

    const title = cleanText(item.find('.course-category').first().text());
    if (!title) return;

    displayOrder += 1;

    const ageRange = cleanText(item.find('.course-tag').first().text()) || null;
    const cardDescription = cleanText(item.find('.course-title').first().text()).replace(/\.{2,}$/, '').trim() || null;
    const image = normalizeAssetPath(item.find('.course-img img').attr('src'));
    const detailFile =
      item.find('.course-img a[href$=".html"]').attr('href') ||
      item.find('.course-content a[href$=".html"]').first().attr('href') ||
      null;

    subjects.push({
      category: 'lower_secondary',
      year,
      title,
      age_range: ageRange,
      description: cardDescription,
      image,
      detailFile,
      display_order: displayOrder,
      status: 'active',
      subject_group: null,
      list_column: null,
    });
  });

  return subjects;
};

const parseUpperSecondaryPage = () => {
  const filePath = staticFile('Upper Secondary.html');
  const $ = cheerio.load(fs.readFileSync(filePath, 'utf8'), { decodeEntities: false });
  const subjects = [];
  let displayOrder = 0;

  const pushSubject = ({ year, title, subject_group, list_column }) => {
    if (!title) return;
    displayOrder += 1;
    subjects.push({
      category: 'upper_secondary',
      year,
      title: cleanText(title),
      age_range: year === 'year_10' ? 'Age 15' : 'Age 16',
      description: null,
      image: null,
      detailFile: getDetailFileForTitle(title),
      display_order: displayOrder,
      status: 'active',
      subject_group,
      list_column,
    });
  };

  const year10Block = $('.filter-item.cat1').first();
  parseListTitles($, year10Block.find('.course-single-include').first()).forEach((title) =>
    pushSubject({ year: 'year_10', title, subject_group: 'core', list_column: null })
  );

  const optionGroups = [
    { selector: '#collapseOne', subject_group: 'arts' },
    { selector: '#collapseTwo', subject_group: 'technology' },
    { selector: '#collapseThree', subject_group: 'humanity' },
  ];

  optionGroups.forEach(({ selector, subject_group }) => {
    parseListTitles($, $(selector)).forEach((title) =>
      pushSubject({ year: 'year_10', title, subject_group, list_column: null })
    );
  });

  const year11Block = $('.filter-item.cat2').first();
  const year11Columns = year11Block.find('.col-6');
  parseListTitles($, year11Columns.eq(0)).forEach((title) =>
    pushSubject({ year: 'year_11', title, subject_group: null, list_column: 1 })
  );
  parseListTitles($, year11Columns.eq(1)).forEach((title) =>
    pushSubject({ year: 'year_11', title, subject_group: null, list_column: 2 })
  );

  return subjects;
};

const enrichWithDetail = (records) => {
  const detailCache = new Map();

  const getDetail = (subject) => {
    if (subject.title === 'Programming') return PROGRAMMING_DETAIL;

    const detailFile = getDetailFileForTitle(subject.title, subject.detailFile);
    if (!detailFile) return null;

    const cacheKey = detailFile.toLowerCase();
    if (!detailCache.has(cacheKey)) {
      detailCache.set(cacheKey, parseDetailPage(detailFile));
    }
    return detailCache.get(cacheKey);
  };

  return records.map((subject) => {
    const detail = getDetail(subject);
    const { detailFile, ...rest } = subject;

    let image = rest.image;
    if (!image && detailFile) {
      const filePath = staticFile(detailFile);
      if (fs.existsSync(filePath)) {
        const $ = cheerio.load(fs.readFileSync(filePath, 'utf8'), { decodeEntities: false });
        image = extractStyleImage($('.video-area').first().attr('style') || '');
      }
    }

    const description = rest.description || detail?.description || null;

    return {
      ...rest,
      image,
      description,
      content: buildContentJson(detail),
    };
  });
};

const parseSecondarySubjects = () => {
  const records = [...parseLowerSecondaryPage(), ...parseUpperSecondaryPage()];
  return enrichWithDetail(records);
};

const parseSecondaryPageSettings = () => ({
  lower_secondary: {
    breadcrumb_title: 'Secondary School',
    page_title: 'Lower Secondary',
    description: 'Affordable Distance Learning Courses at EDUSN International School.',
  },
  upper_secondary: {
    breadcrumb_title: 'Secondary School',
    page_title: 'Upper Secondary (IGCSE)',
    description: 'Affordable Distance Learning Courses at EDUSN International School.',
  },
});

module.exports = {
  parseSecondarySubjects,
  parseSecondaryPageSettings,
};
