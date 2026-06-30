const fs = require('fs');
const cheerio = require('cheerio');
const { staticFile } = require('../lib/paths');
const { cleanText } = require('../lib/utils');

const ACADEMIC_YEAR_PATTERN = /(\d{4}\s*-\s*\d{4})/;

const normalizeApostrophe = (value = '') =>
  value.replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').trim();

const htmlFragmentToText = (html = '') => {
  if (!html) return '';
  return cleanText(
    cheerio.load(`<div>${html}</div>`, { decodeEntities: false })('div').text()
  );
};

const extractAcademicYear = (subtitle = '') => {
  const match = normalizeApostrophe(subtitle).match(ACADEMIC_YEAR_PATTERN);
  return match ? match[1].replace(/\s+/g, '') : '2022-2023';
};

const getSectionHeadingText = ($section) => {
  const titleEl = $section.find('.site-heading .site-title').first();
  const clone = titleEl.clone();
  clone.find('br').replaceWith(' ');
  return normalizeApostrophe(clone.text());
};

const mapSectionCategory = (headingText, subtitle) => {
  const heading = headingText.toLowerCase();
  const sub = normalizeApostrophe(subtitle).toLowerCase();

  if (heading.includes('favorite teacher') || sub.includes('favorite teacher')) {
    return { award_category: "Students' Favorite Teacher Award" };
  }
  if (heading.includes('best student for each grade') || sub.includes('each grade')) {
    return { award_category: 'Best Student for each grade' };
  }
  if (heading.includes('outstanding')) {
    return { award_category: 'Outstanding Student' };
  }
  if (heading.includes('most-improved')) {
    return { award_category: 'Most-Improved Student' };
  }
  if (heading.includes('individual student')) {
    return { award_category: 'Individual Student' };
  }
  if (heading.includes('best student of the') || sub.includes('best student of')) {
    return { award_category: 'Best Student of the Year' };
  }
  if (heading.includes('pbl') || sub.includes('pbl')) {
    const deptMatch = headingText.match(
      /(ENGLISH|SCIENCE|MATHS|ICT|MYANMAR)\s+DEPARTMENT/i
    );
    return {
      award_category: "Campuses' Yearly PBL Awards",
      sub_category: deptMatch
        ? `${deptMatch[1].toUpperCase()} DEPARTMENT`
        : null,
    };
  }

  return { award_category: headingText || 'Awards' };
};

const parseCardAwardTitle = ($card) => {
  const bottomHtml = $card.find('.leaderboard__title--bottom').first().html() || '';
  return htmlFragmentToText(bottomHtml);
};

const parseCardCampus = ($card) =>
  cleanText($card.find('.leaderboard__title--top').first().text());

const isTeacherImage = (src = '') => /subject_icon/i.test(src);

const inferSubjectFromImage = (src = '') => {
  if (/maths/i.test(src)) return 'Maths';
  if (/eng/i.test(src)) return 'English';
  return null;
};

const parseAwards = ({ htmlFile = '2022_2023AY_Awards.html', forceAcademicYear = null } = {}) => {
  const filePath = staticFile(htmlFile);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Awards HTML not found: ${filePath}`);
  }

  const $ = cheerio.load(fs.readFileSync(filePath, 'utf8'), { decodeEntities: false });
  const entries = [];
  let displayOrder = 0;

  $('.course-area.bg').each((_, sectionEl) => {
    const section = $(sectionEl);
    const headingText = getSectionHeadingText(section);
    const subtitle = cleanText(section.find('.site-heading p').first().text());
    if (!headingText && !subtitle) return;

    const academicYear = forceAcademicYear || extractAcademicYear(subtitle);
    const { award_category, sub_category = null } = mapSectionCategory(headingText, subtitle);
    const isTeacherCategory = /favorite teacher/i.test(award_category);

    section.find('article.leaderboard').each((cardIndex, cardEl) => {
      const card = $(cardEl);
      const campus = parseCardCampus(card);
      const awardTitle = parseCardAwardTitle(card);

      card.find('.leaderboard__profile').each((_, profileEl) => {
        const profile = $(profileEl);
        const imgSrc = profile.find('img').attr('src') || '';
        const rawName = cleanText(profile.find('.leaderboard__name').text());
        const value = cleanText(profile.find('.leaderboard__value').text());

        if (!rawName) return;

        const isTeacher = isTeacherCategory || isTeacherImage(imgSrc);
        displayOrder += 1;

        const record = {
          academic_year: academicYear,
          campus: campus || null,
          award_category,
          sub_category,
          award_title: awardTitle || null,
          display_order: displayOrder,
          status: 'active',
        };

        if (isTeacher) {
          record.teacher_name = rawName;
          record.subject = value || inferSubjectFromImage(imgSrc);
        } else {
          record.student_name = rawName;
          record.grade_year = value || null;
        }

        entries.push(record);
      });
    });
  });

  if (!entries.length) {
    throw new Error('No awards parsed from static HTML');
  }

  const academicYear = forceAcademicYear || entries[0]?.academic_year || '2022-2023';
  const normalizedEntries = forceAcademicYear
    ? entries.map((entry) => ({ ...entry, academic_year: forceAcademicYear }))
    : entries;

  return {
    settings: {
      breadcrumb_title: 'Awards',
      default_academic_year: academicYear,
      page_intro: '',
    },
    entries: normalizedEntries,
    academicYear,
  };
};

module.exports = {
  parseAwards,
  mapSectionCategory,
  extractAcademicYear,
};
