const fs = require('fs');
const cheerio = require('cheerio');
const { staticFile } = require('../lib/paths');
const { cleanText, slugify, extractStyleImage } = require('../lib/utils');

const IGCSE_PAGES = [
  { file: 'Mathematics IGCSE.html', category: 'IGCSE', displayOrder: 1 },
  { file: 'Business IGCSE.html', category: 'IGCSE', displayOrder: 2 },
  { file: 'Physics IGCSE.html', category: 'IGCSE', displayOrder: 3 },
  { file: 'English IGCSE.html', category: 'IGCSE', displayOrder: 4 },
];

const A_LEVEL_PAGES = [
  {
    file: 'AS and A Level.html',
    category: 'AS_A_LEVEL',
    displayOrder: 1,
    slug: 'as-a-level',
  },
  {
    file: 'A Level.html',
    category: 'A_LEVEL',
    displayOrder: 1,
    slug: 'a-level',
  },
];

const tabTitleToKey = (title = '') => {
  const value = cleanText(title).toLowerCase();
  if (value.includes('description')) return 'description';
  if (value.includes('about')) return 'about';
  if (value.includes('module')) return 'modules';
  if (value.includes('university')) return 'university';
  if (value.includes('written') && value.includes('assignment')) return 'assignments';
  if (value.includes('course') && value.includes('overview')) return 'overview';
  if (value.includes('career')) return 'career';
  if (value.includes('included') || value.includes('cost')) return 'cost';
  if (value.includes('sit') && value.includes('exam')) return 'exam';
  if (value.includes('eligible') || value.includes('eligibility')) return 'eligible';
  if (value.startsWith('group 1')) return 'group_1';
  if (value.startsWith('group 2')) return 'group_2';
  if (value.startsWith('group 3')) return 'group_3';
  if (value.startsWith('group 4')) return 'group_4';
  if (value.includes('am i eligible')) return 'programme_eligible';
  return slugify(value).replace(/-/g, '_') || 'tab';
};

const cleanTabHtml = (html = '') =>
  html
    .replace(/<i[^>]*class="[^"]*fa-[^"]*"[^>]*>\s*<\/i>/gi, '<span class="course-list-check-inline">✓</span>')
    .trim();

const parseTabs = ($) => {
  const tabs = [];

  $('.course-single-tab .nav-tabs button.nav-link').each((_, button) => {
    const tabButton = $(button);
    const tabTitle = cleanText(tabButton.text().replace(/<br\s*\/?>/gi, ' '));
    const target = tabButton.attr('data-bs-target') || tabButton.attr('data-target') || '';
    const paneId = target.replace(/^#/, '');
    if (!paneId || !tabTitle) return;

    const pane = $(`#${paneId}`);
    const contentRoot = pane.find('.course-single-content').first();
    const content = cleanTabHtml(contentRoot.html() || '');

    tabs.push({
      tab_key: tabTitleToKey(tabTitle),
      tab_title: tabTitle,
      content,
    });
  });

  return tabs;
};

const parseCoursePageFile = (fileName, { category, displayOrder, slug: slugOverride }) => {
  const filePath = staticFile(fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Course HTML not found: ${filePath}`);
  }

  const $ = cheerio.load(fs.readFileSync(filePath, 'utf8'), { decodeEntities: false });
  const title = cleanText($('.breadcrumb-title').first().text());
  if (!title) {
    throw new Error(`Missing breadcrumb title in ${fileName}`);
  }

  const heroStyle = $('.video-area').first().attr('style') || '';
  const thumbnail = extractStyleImage(heroStyle);
  const tabs = parseTabs($);

  return {
    category,
    title,
    slug: slugOverride || slugify(title),
    thumbnail,
    display_order: displayOrder,
    status: 'active',
    tabs,
  };
};

const parseIgcseCourses = () =>
  IGCSE_PAGES.map((page) =>
    parseCoursePageFile(page.file, {
      category: page.category,
      displayOrder: page.displayOrder,
    })
  );

const parseALevelCourses = () =>
  A_LEVEL_PAGES.map((page) =>
    parseCoursePageFile(page.file, {
      category: page.category,
      displayOrder: page.displayOrder,
      slug: page.slug,
    })
  );

module.exports = {
  IGCSE_PAGES,
  A_LEVEL_PAGES,
  parseIgcseCourses,
  parseALevelCourses,
  parseCoursePageFile,
};
