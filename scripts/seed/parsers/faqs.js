const fs = require('fs');
const cheerio = require('cheerio');
const { staticFile } = require('../lib/paths');
const { cleanText } = require('../lib/utils');

const FAQ_FILE = 'faq.html';

const SPECIAL_ANSWER_RULES = [
  {
    test: (question) => /students and teachers.*per class/i.test(question),
    answer_type: 'class_table',
    answer: 'classTable',
  },
  {
    test: (question) => /criteria.*admissions decisions/i.test(question),
    answer_type: 'admission_criteria',
    answer: 'admissionCriteria',
  },
  {
    test: (question) => /application timeline/i.test(question),
    answer_type: 'application_timeline',
    answer: 'applicationTimeline',
  },
  {
    test: (question) => /school begin and end|what time does school/i.test(question),
    answer_type: 'school_timings',
    answer: 'schoolTimings',
  },
];

const parseQuestion = ($, button) => {
  const clone = $(button).clone();
  clone.find('span, i').remove();
  return cleanText(clone.text());
};

const parseTextAnswer = ($, body) => cleanText($(body).text());

const resolveSpecialAnswer = (question) =>
  SPECIAL_ANSWER_RULES.find((rule) => rule.test(question)) || null;

const parsePageInfo = ($) => {
  const titleEl = $('.faq-area .site-title').first();
  const titleText = cleanText(titleEl.text());
  const spanText = cleanText(titleEl.find('span').first().text());
  const headingBefore = spanText
    ? titleText.replace(spanText, '').trim()
    : titleText;
  const headingHighlight = spanText || 'Asked Questions';
  const pageDescription = cleanText($('.faq-area .site-heading p').first().text());

  return {
    type: 'page_info',
    title: titleText || 'General Frequently Asked Questions',
    content: pageDescription || 'Our General Frequently Asked Questions',
    status: 'active',
    extra_data: {
      breadcrumb_title: 'Faq',
      heading_before: headingBefore ? `${headingBefore} ` : 'General Frequently ',
      heading_highlight: headingHighlight,
      heading_description: pageDescription,
    },
  };
};

const parseFaqs = () => {
  const filePath = staticFile(FAQ_FILE);
  if (!fs.existsSync(filePath)) {
    throw new Error(`FAQ HTML not found: ${filePath}`);
  }

  const $ = cheerio.load(fs.readFileSync(filePath, 'utf8'), { decodeEntities: false });
  const pageInfo = parsePageInfo($);
  const faqs = [];
  let displayOrder = 0;

  $('.faq-area .row > .col-lg-6').each((_, columnEl) => {
    $(columnEl)
      .find('.accordion-item')
      .each((_, itemEl) => {
        const item = $(itemEl);
        const question = parseQuestion($, item.find('.accordion-button').first());
        const body = item.find('.accordion-body').first();
        if (!question) return;

        displayOrder += 1;
        const special = resolveSpecialAnswer(question);
        const record = {
          type: 'faq',
          category: 'General',
          question,
          display_order: displayOrder,
          status: 'active',
        };

        if (special) {
          record.answer = special.answer;
          record.extra_data = { answer_type: special.answer_type };
        } else {
          const answer = parseTextAnswer($, body);
          if (!answer) return;
          record.answer = answer;
          record.extra_data = { answer_type: 'text' };
        }

        faqs.push(record);
      });
  });

  if (!faqs.length) {
    throw new Error('No FAQ items parsed from static HTML');
  }

  return { pageInfo, faqs };
};

module.exports = {
  FAQ_FILE,
  parseFaqs,
  resolveSpecialAnswer,
};
