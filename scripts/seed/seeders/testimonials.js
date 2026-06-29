const Testimonial = require('../../../src/models/Testimonial');
const TestimonialSettings = require('../../../src/models/TestimonialSettings');
const { loadHtml } = require('../lib/html');
const { cleanText } = require('../lib/utils');

const seedTestimonials = async () => {
  const $ = loadHtml('index.html');
  const docs = [];
  const seen = new Set();

  $('.testimonial-single').each((index, el) => {
    const item = $(el);
    const message = cleanText(item.find('.testimonial-quote p').text());
    const roleLabel = cleanText(item.find('.testimonial-author-info h4').text());
    const name = cleanText(item.find('.testimonial-author-info p').text()) || roleLabel;
    if (!message) return;

    const key = `${name}:${message.slice(0, 40)}`;
    if (seen.has(key)) return;
    seen.add(key);

    const role = /parent/i.test(roleLabel) ? 'Parent' : 'Student';

    docs.push({
      name: name || roleLabel || 'EDUSN Member',
      role,
      message,
      photo: null,
      rating: 5,
      status: 'approved',
      display_order: docs.length + 1,
    });
  });

  await TestimonialSettings.deleteMany({});
  await TestimonialSettings.create({
    breadcrumb_title: 'Testimonial',
    heading_before: 'What Our ',
    heading_highlight: cleanText($('.testimonial-area .site-title span').text()) || "Students Say's",
    heading_description:
      cleanText($('.testimonial-area .site-heading p').text()) ||
      'Below are a few words from students who have studied with EDUSN.',
    homepage_heading_before: 'What Our ',
    homepage_heading_highlight: cleanText($('.testimonial-area .site-title span').text()) || "Students Say's",
    homepage_subtitle:
      cleanText($('.testimonial-area .site-heading p').text()) ||
      'Below are a few words from students who have studied with EDUSN.',
  });

  if (docs.length) {
    await Testimonial.insertMany(docs);
  }

  console.log(`  testimonials: ${docs.length}`);
};

module.exports = seedTestimonials;
