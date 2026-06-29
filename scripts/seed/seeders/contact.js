const ContactInfo = require('../../../src/models/ContactInfo');
const { loadHtml } = require('../lib/html');
const { cleanText } = require('../lib/utils');

const extractEmails = (panel, $) => {
  const emails = [];
  panel.find('a[href^="mailto:"]').each((_, el) => {
    const email = ($(el).attr('href') || '').replace('mailto:', '').trim();
    if (email) emails.push(email);
  });
  return emails;
};

const extractPhones = (panel, $) => {
  const phones = [];
  panel.find('.contact-info').each((_, block) => {
    const heading = cleanText($(block).find('h5').text()).toLowerCase();
    if (!heading.includes('phone')) return;
    const text = cleanText($(block).find('p').text());
    if (text) phones.push(text);
  });
  return phones;
};

const seedContact = async () => {
  const $ = loadHtml('Contact.html');
  const docs = [];

  const campusTabOrder = [];
  $('.campus-tabs .campus-tab').each((_, el) => {
    campusTabOrder.push({
      id: $(el).attr('data-tab'),
      label: cleanText($(el).text()),
    });
  });

  campusTabOrder.forEach((tab, index) => {
    const panel = $(`#${tab.id}`);
    if (!panel.length) return;

    const title = cleanText(panel.find('.contact-form-header h2').text()) || tab.label;
    const subTitle = cleanText(panel.find('.contact-form-header p').text());
    const addressBlock = panel
      .find('.contact-info')
      .filter((_, el) => cleanText($(el).find('h5').text()).toLowerCase().includes('address'))
      .first();
    const address = cleanText(addressBlock.find('p').text());
    const emails = extractEmails(panel, $);
    const phones = extractPhones(panel, $);
    const mapSrc = panel.find('iframe').attr('src') || null;

    docs.push({
      type: 'campus',
      name: title,
      sub_title: subTitle,
      address,
      emails: {
        general: emails[0] || null,
        office: emails[1] || null,
        support: emails[2] || null,
        admissions: emails[3] || null,
      },
      phones: {
        main: phones[0] || null,
        hotline: phones[1] || null,
        emergency: phones[2] || null,
      },
      display_order: index + 1,
      status: 'active',
      extra_data: {
        tab_id: tab.id,
        map_embed_url: mapSrc,
        email_list: emails,
        phone_list: phones,
      },
    });
  });

  const officeTabOrder = [];
  $('.office-tabs .office-tab').each((_, el) => {
    officeTabOrder.push({
      id: $(el).attr('data-tab'),
      label: cleanText($(el).text()),
    });
  });

  officeTabOrder.forEach((tab, index) => {
    const panel = $(`#${tab.id}`);
    if (!panel.length) return;

    const title = cleanText(panel.find('.contact-form-header h2').text()) || tab.label;
    const subTitle = cleanText(panel.find('.contact-form-header p').text());
    const addressBlock = panel
      .find('.contact-info')
      .filter((_, el) => cleanText($(el).find('h5').text()).toLowerCase().includes('address'))
      .first();
    const address = cleanText(addressBlock.find('p').text());
    const emails = extractEmails(panel, $);
    const phones = extractPhones(panel, $);

    docs.push({
      type: 'office',
      name: title,
      sub_title: subTitle,
      address,
      emails: {
        general: emails[0] || null,
        office: emails[1] || null,
        support: emails[2] || null,
        admissions: emails[3] || null,
      },
      phones: {
        main: phones[0] || null,
        hotline: phones[1] || null,
        emergency: phones[2] || null,
      },
      display_order: index + 1,
      status: 'active',
      extra_data: {
        tab_id: tab.id,
        is_hq: /united kingdom/i.test(title),
        phone_groups: phones.map((phone, groupIndex) => ({
          label: groupIndex === 0 ? 'Main' : `Line ${groupIndex + 1}`,
          numbers: [phone],
        })),
      },
    });
  });

  await ContactInfo.insertMany(docs);
  console.log(`  contact entries: ${docs.length}`);
};

module.exports = seedContact;
