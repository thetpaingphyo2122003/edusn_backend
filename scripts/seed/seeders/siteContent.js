const SiteContent = require('../../../src/models/SiteContent');
const { loadHtml } = require('../lib/html');
const { cleanText, normalizeAssetPath, extractStyleImage } = require('../lib/utils');

const seedSiteContent = async () => {
  const $ = loadHtml('index.html');

  const heroSubTitle = cleanText($('.hero-content .hero-sub-title').first().text());
  const heroParagraphs = $('.hero-content p')
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter(Boolean);
  const heroImage =
    extractStyleImage($('.hero-img').first().attr('style')) ||
    normalizeAssetPath($('.hero-img img').first().attr('src'));

  const aboutArea = $('.about-area').first();
  const aboutSubTitle = cleanText(aboutArea.find('.hero-sub-title').text());
  const aboutTitleHtml = aboutArea.find('.site-title').first().html() || '';
  const aboutText = cleanText(aboutArea.find('.about-text').text());
  const aboutImage = normalizeAssetPath($('.about-area').first().find('.about-img img').attr('src'));

  const missionSubTitle = cleanText($('.step-area .hero-sub-title').text());
  const missionTitle = cleanText($('.step-area .site-title').text());
  const missionVideo = $('.step-area .popup-youtube').attr('href') || null;

  const cultureArea = $('.about-area.pt-100').first();
  const cultureSubTitle = cleanText(cultureArea.find('.hero-sub-title').text());
  const cultureTitleHtml = cultureArea.find('.site-title').first().html() || '';
  const cultureTextHtml = cultureArea.find('p.about-text').first().html() || '';
  const cultureImage = normalizeAssetPath(cultureArea.find('img').first().attr('src'));

  const counters = [];
  $('.counter-area .counter-box').each((index, el) => {
    const box = $(el);
    const value = cleanText(box.find('.counter').first().text() || box.find('.counter').attr('data-to'));
    const title = cleanText(box.find('.title').text());
    if (value && title) {
      counters.push({ key: `stat_${index + 1}`, value, label: title });
    }
  });

  const attendingTitle = cleanText($('.students-join1-right h2').first().text());
  const attendingText = cleanText($('.students-join1-right p').first().text());

  const ctaArea = $('.cta-area').first();
  const ctaTitle = cleanText(ctaArea.find('h2').first().text());
  const ctaText = cleanText(ctaArea.find('p').first().text());
  const ctaButton = cleanText(ctaArea.find('.cta-btn').first().text());
  const ctaLink = ctaArea.find('.cta-btn').first().attr('href') || 'https://edusnglobal.com/';
  const ctaImage = normalizeAssetPath(ctaArea.find('.cta-img img').attr('src'));

  const docs = [
    {
      section_key: 'hero',
      title: heroSubTitle || 'EXCITING NEW FACE OF EDUCATION',
      content: heroParagraphs.join('\n\n'),
      sub_content: heroParagraphs[0] || null,
      image: heroImage,
      button_text: cleanText($('.hero-content .blog-btn').first().text()) || 'Read More',
      button_link: $('.hero-content .blog-btn').first().attr('href') || '/about',
      extra_data: { paragraphs: heroParagraphs },
    },
    {
      section_key: 'about',
      title: aboutSubTitle || 'About Us',
      content: aboutText,
      sub_content: aboutTitleHtml,
      image: aboutImage,
      button_text: 'Read More',
      button_link: '/about',
    },
    {
      section_key: 'mission',
      title: missionSubTitle || 'Mission',
      content: missionTitle,
      sub_content: null,
      image: null,
      extra_data: { video_url: missionVideo },
    },
    {
      section_key: 'culture',
      title: cultureSubTitle || 'Culture',
      content: cultureTextHtml,
      sub_content: cultureTitleHtml,
      image: cultureImage,
    },
    {
      section_key: 'statistics',
      title: 'Statistics',
      content: null,
      extra_data: {
        items: counters,
        students: counters[0]?.value || '1500',
        teachers: counters[1]?.value || '150',
        courses: counters[2]?.value || '30',
      },
    },
    {
      section_key: 'attending_virtually',
      title: attendingTitle || 'Attending School Virtually',
      content: attendingText,
      sub_content: null,
      image: '/assets/img/students/2.jpg',
      button_text: 'Learn More',
      button_link: '/attending-school-virtually',
    },
    {
      section_key: 'cta',
      title: ctaTitle || 'Introducing an Exciting Opportunity for Students Worldwide',
      content: ctaText,
      button_text: ctaButton || 'GLobal Education',
      button_link: ctaLink,
      image: ctaImage || '/assets/img/edu.png',
    },
  ];

  await SiteContent.deleteMany({});
  await SiteContent.insertMany(docs);
  console.log(`  site content: ${docs.length} sections`);
};

module.exports = seedSiteContent;
