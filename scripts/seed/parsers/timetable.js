const fs = require('fs');
const cheerio = require('cheerio');
const { staticFile } = require('../lib/paths');
const { cleanText, normalizeAssetPath } = require('../lib/utils');

const TIMETABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const VALID_COLOR_CLASSES = new Set([
  'bg-sky',
  'bg-yellow',
  'bg-lightred',
  'bg-purple',
  'bg-green',
  'bg-cri',
  'bg-hel',
]);

const ROW_HIGHLIGHT_CLASSES = new Set(['Morado']);

const parseTime12To24 = (timeStr = '') => {
  const match = cleanText(timeStr).match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return timeStr;

  let hour = parseInt(match[1], 10);
  const minute = match[2];
  const meridiem = match[3].toLowerCase();

  if (meridiem === 'pm' && hour !== 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;

  return `${String(hour).padStart(2, '0')}:${minute}`;
};

const parseTimeRange = (text = '') => {
  const parts = cleanText(text).split(/\s*-\s*/);
  if (parts.length !== 2) {
    return { start_time: null, end_time: null };
  }

  return {
    start_time: parseTime12To24(parts[0]),
    end_time: parseTime12To24(parts[1]),
  };
};

const extractColorClass = (classAttr = '') =>
  classAttr
    .split(/\s+/)
    .find((token) => VALID_COLOR_CLASSES.has(token)) || 'bg-sky';

const normalizeImagePath = (src = '') => {
  if (!src) return '/img/content/timetable.png';
  const trimmed = src.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `/${trimmed}`;
};

const parseTimetable = () => {
  const filePath = staticFile('Timetable.html');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Timetable HTML not found: ${filePath}`);
  }

  const $ = cheerio.load(fs.readFileSync(filePath, 'utf8'), { decodeEntities: false });
  const entries = [];
  const yearSections = [];
  let defaultDescription = 'The daily schedule for students varies based on their year levels:';
  let defaultImage = '/img/content/timetable.png';

  $('.course-area.bg').each((sectionIndex, sectionEl) => {
    const section = $(sectionEl);
    const table = section.find('table.table-bordered').first();
    if (!table.length) return;

    const yearMatch = cleanText(section.find('h2.site-title span').first().text()).match(
      /\(\s*(.+?)\s*\)/
    );
    const academicYear = yearMatch?.[1] || `Section ${sectionIndex + 1}`;
    const description = cleanText(section.find('.site-heading p').first().text());
    const imageSrc = section.find('.timetable-img img').first().attr('src') || '';
    const image = normalizeImagePath(imageSrc);

    if (sectionIndex === 0 && description) {
      defaultDescription = description;
    }
    if (sectionIndex === 0 && imageSrc) {
      defaultImage = image;
    }

    yearSections.push({
      academic_year: academicYear,
      description: description || '',
      image,
      display_order: sectionIndex,
    });

    const headerDays = [];
    table
      .find('thead th')
      .slice(1)
      .each((_, th) => {
        const day = cleanText($(th).text());
        if (TIMETABLE_DAYS.includes(day)) headerDays.push(day);
      });

    const days = headerDays.length ? headerDays : TIMETABLE_DAYS;

    table.find('tbody tr').each((rowIndex, rowEl) => {
      const row = $(rowEl);
      const cells = row.find('td');
      if (!cells.length) return;

      const rowStartDisplay = cleanText(cells.first().text());

      cells.slice(1).each((dayIndex, cellEl) => {
        const cell = $(cellEl);
        const classSpan = cell.find('span').first();
        const className = cleanText(classSpan.text());
        if (!className) return;

        const timeText = cleanText(cell.find('.font-size14').first().text());
        const { start_time: rangeStart, end_time } = parseTimeRange(timeText);
        const start_time = rangeStart || parseTime12To24(rowStartDisplay);
        if (!start_time || !end_time) return;

        const day_of_week = days[dayIndex];
        if (!day_of_week) return;

        entries.push({
          academic_year: academicYear,
          class_name: className,
          color_class: extractColorClass(classSpan.attr('class') || ''),
          row_highlight:
            cell.hasClass('bg-light-gray') || ROW_HIGHLIGHT_CLASSES.has(className),
          day_of_week,
          start_time,
          end_time,
          display_order: rowIndex,
          status: 'active',
        });
      });
    });
  });

  if (!entries.length) {
    throw new Error('No timetable entries parsed from static HTML');
  }

  return {
    settings: {
      default_description: defaultDescription,
      default_image: defaultImage,
      year_sections: yearSections,
    },
    entries,
  };
};

module.exports = {
  parseTimetable,
  parseTime12To24,
  parseTimeRange,
};
