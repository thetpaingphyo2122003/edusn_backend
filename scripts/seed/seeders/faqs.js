const Faq = require('../../../src/models/Faq');
const { parseFaqs } = require('../parsers/faqs');

const seedFaqs = async () => {
  const { pageInfo, faqs } = parseFaqs();

  await Faq.deleteMany({});
  await Faq.insertMany([pageInfo, ...faqs]);

  const specialCount = faqs.filter(
    (faq) => faq.extra_data?.answer_type && faq.extra_data.answer_type !== 'text'
  ).length;

  console.log(`  faqs: ${faqs.length} (+ page info, ${specialCount} structured answers)`);
  return faqs.length;
};

module.exports = seedFaqs;
