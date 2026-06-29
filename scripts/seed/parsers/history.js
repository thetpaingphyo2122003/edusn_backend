const fs = require('fs');
const cheerio = require('cheerio');
const { staticFile } = require('../lib/paths');
const { cleanText, normalizeAssetPath } = require('../lib/utils');

const HISTORY_FILE = 'School_History.html';

const BG_IMAGES = [
  '/assets/img/history/bg/4.png',
  '/assets/img/history/bg/2.png',
  '/assets/img/history/bg/1.png',
  '/assets/img/history/bg/3.png',
  '/assets/img/history/bg/2.png',
  '/assets/img/history/bg/1.png',
  '/assets/img/history/bg/7.png',
];

const SLIDE_TITLES = [
  'Meet Mr. Soe Naing',
  'Founder & Visionary',
  'SCIBN College',
  'Virtual School Launch',
  'EDUHOME',
  'Leadership & Hope',
  'Transforming Lives',
];

const normalizeHistoryPath = (src = '') => {
  const cleaned = src.trim().replace(/^\.\//, '');
  return normalizeAssetPath(cleaned);
};

const parseSlide = ($, slide, index) => {
  const images = $(slide)
    .find('.slide__img img')
    .map((_, el) => normalizeHistoryPath($(el).attr('src') || ''))
    .get()
    .filter(Boolean);

  const text = cleanText($(slide).find('.js-slider__text-line div').first().text());
  const isIntro = index === 0;

  return {
    type: 'timeline',
    year: null,
    title: isIntro ? text : SLIDE_TITLES[index] || `Slide ${index + 1}`,
    description: isIntro ? null : text || null,
    main_image: images[0] || null,
    gallery_images: images[1] ? [images[1]] : [],
    banner_image: BG_IMAGES[index] || null,
    display_order: index + 1,
    status: 'active',
  };
};

const parseHistory = () => {
  const filePath = staticFile(HISTORY_FILE);
  const html = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(html);

  const timeline = $('.js-slider > .js-slide')
    .map((index, slide) => parseSlide($, slide, index))
    .get();

  return { timeline };
};

module.exports = {
  parseHistory,
};
