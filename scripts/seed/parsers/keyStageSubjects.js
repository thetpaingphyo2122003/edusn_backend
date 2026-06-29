const fs = require('fs');
const cheerio = require('cheerio');
const { staticFile } = require('../lib/paths');
const { cleanText, normalizeAssetPath } = require('../lib/utils');

const KS1_YEAR_MAP = { cat1: 'year_1', cat2: 'year_2' };
const KS2_YEAR_MAP = { cat1: 'year_3', cat2: 'year_4', cat3: 'year_5', cat4: 'year_6' };

const MYANMAR_DETAIL = {
  description:
    'Develop Myanmar language skills through reading, writing, speaking and listening activities designed for primary learners at EDUSN International School.',
  highlights: ['Reading', 'Writing', 'Speaking', 'Listening', 'Grammar'],
  pdfLink: null,
};

const normalizePdfPath = (href = '') => {
  if (!href) return null;
  const value = href.trim();
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return value;
  return `/${value}`;
};

const getSubjectGroup = (title = '') => {
  const core = ['English', 'Mathematics', 'Science'];
  if (core.includes(title)) return 'Core';
  return 'Foundation';
};

const getListColumn = (title = '') => {
  const columnOne = ['English', 'Mathematics', 'Science', 'ICT ( CS & Coding )'];
  return columnOne.includes(title) ? 1 : 2;
};

const parseDetailPage = (detailFile) => {
  if (!detailFile) return null;

  const filePath = staticFile(detailFile);
  if (!fs.existsSync(filePath)) return null;

  const $ = cheerio.load(fs.readFileSync(filePath, 'utf8'), { decodeEntities: false });
  const details = $('.course-single-details').first();
  if (!details.length) return null;

  const description = cleanText(details.find('p').first().text()) || null;
  const highlights = details
    .find('.course-single-list li')
    .map((_, li) => cleanText($(li).text()))
    .get()
    .filter(Boolean);
  const pdfHref = details.find('a.blog-btn[href]').attr('href') || null;

  return {
    description,
    highlights,
    pdfLink: normalizePdfPath(pdfHref),
  };
};

const buildContentJson = (detail) => {
  if (!detail || (!detail.description && !detail.highlights?.length && !detail.pdfLink)) {
    return null;
  }

  return JSON.stringify({
    description: detail.description || '',
    highlights: detail.highlights || [],
    pdfLink: detail.pdfLink || null,
  });
};

const parseKeyStagePage = (htmlFile, category, yearMap) => {
  const filePath = staticFile(htmlFile);
  const $ = cheerio.load(fs.readFileSync(filePath, 'utf8'), { decodeEntities: false });
  const subjects = [];
  let displayOrder = 0;

  $('.filter-item').each((_, element) => {
    const item = $(element);
    const classAttr = item.attr('class') || '';
    const catMatch = classAttr.match(/\bcat(\d+)\b/);
    const catKey = catMatch ? `cat${catMatch[1]}` : null;
    const year = catKey ? yearMap[catKey] : null;
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
      category,
      year,
      title,
      age_range: ageRange,
      description: cardDescription,
      image,
      detailFile,
      display_order: displayOrder,
      status: 'active',
      subject_group: getSubjectGroup(title),
      list_column: getListColumn(title),
    });
  });

  return subjects;
};

const parseKeyStageSubjects = () => {
  const detailCache = new Map();

  const getDetail = (subject) => {
    if (subject.title === 'Myanmar Language') return MYANMAR_DETAIL;

    const detailFile = subject.detailFile;
    if (!detailFile) return null;

    const cacheKey = detailFile.toLowerCase();
    if (!detailCache.has(cacheKey)) {
      detailCache.set(cacheKey, parseDetailPage(detailFile));
    }
    return detailCache.get(cacheKey);
  };

  const records = [
    ...parseKeyStagePage('Key Stage1.html', 'key_stage_1', KS1_YEAR_MAP),
    ...parseKeyStagePage('Key Stage2.html', 'key_stage_2', KS2_YEAR_MAP),
  ];

  return records.map((subject) => {
    const detail = getDetail(subject);
    const { detailFile, ...rest } = subject;
    return {
      ...rest,
      content: buildContentJson(detail),
    };
  });
};

const parseKeyStagePageSettings = () => ({
  key_stage_1: {
    breadcrumb_title: 'Primary School',
    page_title: 'Key Stage 1',
    age_range: '5 - 7 Years',
    description: 'Affordable Distance Learning Courses at EDUSN International School.',
  },
  key_stage_2: {
    breadcrumb_title: 'Primary School',
    page_title: 'Key Stage 2',
    age_range: '7 - 11 Years',
    description: 'Affordable Distance Learning Courses at EDUSN International School.',
  },
});

module.exports = {
  parseKeyStageSubjects,
  parseKeyStagePageSettings,
  parseDetailPage,
  buildContentJson,
};
