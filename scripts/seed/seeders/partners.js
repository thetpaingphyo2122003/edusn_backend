const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const Partner = require('../../../src/models/Partner');
const { STATIC_ROOT, staticFile } = require('../lib/paths');
const { cleanText, normalizeAssetPath } = require('../lib/utils');

const COUNTRY_CONFIGS = [
  { category: 'UK', folder: 'study-in-uk', profile: 'ukprofile.html' },
  { category: 'US', folder: 'study-in-us', profile: 'usprofile.html' },
  { category: 'Australia', folder: 'study-in-australia', profile: 'auprofile.html' },
  { category: 'Canada', folder: 'study-in-canada', profile: 'canadaprofile.html' },
  { category: 'Thailand', folder: 'study-in-thailand', profile: 'thailandprofile.html' },
  { category: 'Singapore', folder: 'study-in-singapore', profile: 'singaporeprofile.html' },
];

const loadCheerio = (relativePath) => {
  const filePath = staticFile(relativePath);
  const html = fs.readFileSync(filePath, 'utf8');
  return cheerio.load(html, { decodeEntities: false });
};

const toAssetPath = (folder, src = '') => {
  if (!src) return null;
  const value = src.trim();
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return value;
  if (value.startsWith('assets/') || value.startsWith('../assets/')) {
    return normalizeAssetPath(value.replace(/^\.\.\//, ''));
  }
  const normalized = path.posix
    .join(folder.replace(/\\/g, '/'), value)
    .replace(/\\/g, '/')
    .replace(/^\.\//, '');
  return `/${normalized}`;
};

const parseProgramsTable = ($, table) => {
  const rows = [];
  $(table)
    .find('tbody tr')
    .each((index, tr) => {
      const cells = $(tr)
        .children('th,td')
        .map((_, cell) => cleanText($(cell).text()))
        .get();
      if (cells.length < 6) return;
      rows.push({
        no: Number.parseInt(cells[0], 10) || index + 1,
        programs: cells[1] || null,
        intakes: cells[2] || null,
        duration: cells[3] || null,
        requirements: cells[4] || null,
        fees: cells[5] || null,
      });
    });
  return rows;
};

const parseUniversityDetail = (folder, detailFile) => {
  const relativePath = path.posix.join(folder, detailFile);
  const $ = loadCheerio(relativePath);

  const intro = $('.profile-intro-left-content');
  const detailTable = $('.profile-details table');
  const detailRows = {};
  detailTable.find('tr').each((_, tr) => {
    const key = cleanText($(tr).find('th').text()).toLowerCase();
    const emailHref = $(tr).find('a[href^="mailto:"]').attr('href');
    const websiteHref = $(tr).find('a[href^="http"]').attr('href');
    let value = cleanText($(tr).find('td').text());
    if (emailHref) value = emailHref.replace(/^mailto:/i, '');
    else if (websiteHref && key === 'website') value = websiteHref;
    if (key) detailRows[key] = value;
  });

  const rankingItems = $('.profile-intro-right-item');
  const globalRanking = cleanText(rankingItems.eq(0).find('h3').text()) || null;
  const localRanking = cleanText(rankingItems.eq(1).find('h3').text()) || null;

  const foundationTabButton = $('#profile-tab2');
  const bachelorTabButton = $('#profile-tab3');
  const foundationPrograms = parseProgramsTable($, $('#tab2 table'));
  const bachelorPrograms = parseProgramsTable($, $('#tab3 table'));
  const foundationLink = $('#tab2 .header-btn').first().attr('href') || null;
  const bachelorLink = $('#tab3 .header-btn').first().attr('href') || null;
  const mapUrl = $('#tab5 iframe').attr('src') || null;
  const calendlyUrl =
    ($('.profile-menu .btn.btn-dark').attr('onclick') || '').match(/url:\s*'([^']+)'/)?.[1] || null;

  return {
    name: cleanText(intro.find('h4').text()) || cleanText($('.breadcrumb-title').text()),
    description: cleanText($('.profile-about p').first().text()) || null,
    website_url: $('#tab1 a[href^="http"]').first().attr('href') || bachelorLink || foundationLink || null,
    pathway_tab_label: cleanText(foundationTabButton.text()) || 'Foundation',
    foundation_url: foundationLink,
    bachelor_url: bachelorLink,
    map_url: mapUrl,
    calendly_url: calendlyUrl,
    foundation_programs: foundationPrograms,
    bachelor_programs: bachelorPrograms,
    degree_type: cleanText(intro.find('p').first().text()) || detailRows.type || null,
    university_name: detailRows['university name'] || cleanText(intro.find('h4').text()) || null,
    email: detailRows.email || null,
    phone: detailRows.phone || null,
    location: detailRows.location || null,
    founded: detailRows.founded || null,
    institution_type: detailRows.type || null,
    global_ranking: globalRanking,
    local_ranking: localRanking,
    programme_name: bachelorPrograms[0]?.programs || foundationPrograms[0]?.programs || null,
    fees: bachelorPrograms[0]?.fees || foundationPrograms[0]?.fees || null,
    duration: bachelorPrograms[0]?.duration || foundationPrograms[0]?.duration || null,
    progression_from: cleanText(foundationTabButton.text()) || null,
    search_tags: [
      detailRows.location,
      detailRows.type,
      detailRows.founded,
      foundationPrograms.map((row) => row.programs).join(', '),
      bachelorPrograms.map((row) => row.programs).join(', '),
    ]
      .filter(Boolean)
      .join(', '),
    title: cleanText($('.breadcrumb-title').text()) || null,
    content: cleanText($('.profile-about').text()) || null,
  };
};

const seedPartners = async () => {
  const docs = [];

  for (const config of COUNTRY_CONFIGS) {
    const $ = loadCheerio(path.posix.join(config.folder, config.profile));

    await Partner.create({
      type: 'page_info',
      name: cleanText($('.breadcrumb-title').text()) || `Study in ${config.category}`,
      country_category: config.category,
      title: cleanText($('.breadcrumb-title').text()) || `Study in ${config.category}`,
      content: `Study abroad partner universities in ${config.category}.`,
      display_order: docs.length + 1,
      status: 'active',
    });

    $('.instructor-item').each((index, el) => {
      const link = $(el).find('.instructor-img a').attr('href');
      if (!link) return;

      const logoSrc = $(el).find('.instructor-img img').attr('src');
      const detail = parseUniversityDetail(config.folder, link);

      docs.push({
        type: 'university',
        name: detail.name,
        description: detail.description,
        logo_path: toAssetPath(config.folder, logoSrc),
        country_category: config.category,
        website_url: detail.website_url,
        pathway_tab_label: detail.pathway_tab_label,
        foundation_url: detail.foundation_url,
        bachelor_url: detail.bachelor_url,
        map_url: detail.map_url,
        calendly_url: detail.calendly_url,
        foundation_programs: detail.foundation_programs,
        bachelor_programs: detail.bachelor_programs,
        social_links: {
          facebook: null,
          twitter: null,
          linkedin: null,
        },
        degree_type: detail.degree_type,
        university_name: detail.university_name,
        email: detail.email,
        phone: detail.phone,
        location: detail.location,
        founded: detail.founded,
        institution_type: detail.institution_type,
        global_ranking: detail.global_ranking,
        local_ranking: detail.local_ranking,
        programme_name: detail.programme_name,
        fees: detail.fees,
        duration: detail.duration,
        progression_from: detail.progression_from,
        search_tags: detail.search_tags,
        title: detail.title,
        content: detail.content,
        display_order: index + 1,
        status: 'active',
      });
    });
  }

  if (docs.length) {
    await Partner.insertMany(docs);
  }

  console.log(`  study abroad partners: ${docs.length} universities`);
};

module.exports = seedPartners;
