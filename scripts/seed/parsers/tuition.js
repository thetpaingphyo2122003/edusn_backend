const fs = require('fs');
const cheerio = require('cheerio');
const { staticFile } = require('../lib/paths');
const { cleanText, normalizeAssetPath } = require('../lib/utils');

const FEE_PAGES = [
  { file: 'campus_fees.html', category: 'campus', secondaryField: 'material' },
  { file: 'virtual-fees.html', category: 'virtual', secondaryField: 'microsoft', installmentOnly: true },
  { file: 'IGCSE_fees.html', category: 'gcse_a_level', secondaryField: 'material' },
];

const normalizeYearTitle = (title = '') =>
  cleanText(title)
    .replace(/\s+/g, ' ')
    .replace(/^year\s*1\s*-\s*3$/i, 'Year 1 to 3')
    .replace(/^year\s*4\s*-\s*6$/i, 'Year 4 to 6');

const normalizeProgramName = (title = '', category) => {
  const value = cleanText(title);
  if (category !== 'gcse_a_level') return value;

  if (/gcse\s*o/i.test(value)) return 'GCSE O Level';
  if (/a\s*level/i.test(value)) return 'A Level';
  return value;
};

const parseMoneyMmk = (text = '') => {
  const match = cleanText(text).match(/\+?([\d,]+)\s*MMK/i);
  return match ? parseInt(match[1].replace(/,/g, ''), 10) : null;
};

const parseMoneyUsd = (text = '') => {
  const match = cleanText(text).match(/\+?([\d.]+)\s*USD/i);
  return match ? parseFloat(match[1]) : null;
};

const getSpanAmount = ($scope, currency) => {
  const text = $scope.find(`span[data-currency="${currency}"]`).first().text();
  return currency === 'MMK' ? parseMoneyMmk(text) : parseMoneyUsd(text);
};

const parseInstallments = ($item) => {
  const installments = [];

  $item.find('.pricing-feature li').each((_, li) => {
    const row = cheerio.load(li);
    const payText = cleanText(row('.paytext').text());
    if (!/installment/i.test(payText)) return;

    installments.push({
      amountMmk: getSpanAmount(row.root(), 'MMK'),
      amountUsd: getSpanAmount(row.root(), 'USD'),
    });
  });

  return installments.filter((item) => item.amountMmk != null);
};

const parsePricingItem = ($, item, category, secondaryField) => {
  const title = normalizeYearTitle($(item).find('h5.optionprice').first().text());
  if (!title) return null;

  const amountBlock = $(item).find('.pricing-amount').first();
  const totalMmk = getSpanAmount(amountBlock, 'MMK');
  const totalUsd = getSpanAmount(amountBlock, 'USD');

  const secondaryText = cleanText(amountBlock.find('p').last().text()).toLowerCase();
  const secondaryMmk = getSpanAmount(amountBlock.find('p').last(), 'MMK');
  const secondaryUsd = getSpanAmount(amountBlock.find('p').last(), 'USD');

  const installments = parseInstallments($(item));
  if (!totalMmk || !installments.length) return null;

  const isMicrosoft =
    secondaryField === 'microsoft' || secondaryText.includes('microsoft');
  const isMaterial = secondaryField === 'material' || secondaryText.includes('material');

  return {
    title,
    program_name: normalizeProgramName(title, category),
    totalMmk,
    totalUsd,
    materialMmk: isMaterial ? secondaryMmk : 0,
    materialUsd: isMaterial ? secondaryUsd : null,
    secondaryMmk: isMicrosoft ? secondaryMmk : isMaterial ? secondaryMmk : 0,
    secondaryUsd: isMicrosoft ? secondaryUsd : isMaterial ? secondaryUsd : null,
    installments,
  };
};

const parsePageHeading = ($) => {
  const heading = cleanText($('.site-title.herotext').first().text());
  const spanText = cleanText($('.site-title.herotext span').first().text());
  return {
    page_heading: heading.replace(spanText, '').trim() || heading,
    page_subtitle: spanText ? spanText.replace(/^\(|\)$/g, '').trim() : '',
  };
};

const parseFeePage = (fileName, { category, secondaryField, installmentOnly = false }) => {
  const filePath = staticFile(fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Tuition HTML not found: ${filePath}`);
  }

  const $ = cheerio.load(fs.readFileSync(filePath, 'utf8'), { decodeEntities: false });
  const heading = parsePageHeading($);
  const items = [];
  const seenTitles = new Set();

  $('.pricing-item').each((_, item) => {
    if (installmentOnly) {
      const planType = cleanText($(item).find('.pricing-amount-type span').first().text());
      if (!/installment plan/i.test(planType)) return;
    }

    const parsed = parsePricingItem($, item, category, secondaryField);
    if (!parsed) return;

    const dedupeKey = parsed.title.toLowerCase();
    if (seenTitles.has(dedupeKey)) return;
    seenTitles.add(dedupeKey);

    items.push(parsed);
  });

  if (!items.length) {
    throw new Error(`No pricing items parsed from ${fileName}`);
  }

  const settings = { ...heading };

  if (category === 'virtual') {
    settings.currency_intro_heading = cleanText($('h4').filter((_, el) => /currency display/i.test($(el).text())).first().text());
    settings.currency_intro_text = cleanText(
      $('h4')
        .filter((_, el) => /currency display/i.test($(el).text()))
        .first()
        .next('p')
        .text()
    );
    settings.show_currency_selector = true;
    settings.secondary_fee_label = 'Microsoft Teams license fees';
    settings.secondary_fee_field = 'microsoft';
  }

  if (category === 'campus') {
    settings.show_currency_selector = false;
    settings.secondary_fee_label = 'Material Fees';
    settings.secondary_fee_field = 'material';
    settings.breadcrumb_active = 'Campus Fees';
  }

  if (category === 'gcse_a_level') {
    settings.page_heading = cleanText($('.site-title.herotext').first().text()) || settings.page_heading;
    settings.breadcrumb_title = 'IGCSE O Level Fees';
    settings.breadcrumb_active = 'IGCSE Fees';
    settings.show_currency_selector = false;
    settings.scholarship_note = cleanText(
      $('.border-primary h6').first().text().replace(/^.*scholarship/i, 'up to 50 % scholarship based on grading for old students')
    );
    const noteParagraph = $('.border-primary p').filter((_, el) => /every two months/i.test($(el).text())).first();
    settings.installment_note = cleanText(noteParagraph.text()) || undefined;
  }

  return { category, items, settings };
};

const parsePaymentInfo = () => {
  const filePath = staticFile('Payment.html');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Payment HTML not found: ${filePath}`);
  }

  const $ = cheerio.load(fs.readFileSync(filePath, 'utf8'), { decodeEntities: false });
  const bank_accounts = [];

  $('.feature-area .feature-item').each((_, item) => {
    const card = $(item);
    const parentCol = card.closest('[data-bs-content]');
    const account_number = cleanText(card.find('.feature-content h4').first().text());
    const account_name = cleanText(card.find('.feature-content p.fw-bold').first().text());
    const bank_logo = normalizeAssetPath(card.find('img').first().attr('src') || '');
    const company = parentCol.attr('data-bs-content') || null;

    if (!account_number || !account_name) return;

    bank_accounts.push({
      account_name,
      account_number,
      company,
      bank_logo,
      qr_code_image: null,
    });
  });

  if (!bank_accounts.length) {
    throw new Error('No bank accounts parsed from Payment.html');
  }

  return { bank_accounts };
};

const parseAllTuition = () => {
  const feePages = FEE_PAGES.map((page) => parseFeePage(page.file, page));
  const payment = parsePaymentInfo();

  const settings = {};
  feePages.forEach((page) => {
    settings[page.category] = page.settings;
  });

  return {
    feePages,
    payment,
    settings,
  };
};

module.exports = {
  FEE_PAGES,
  parseFeePage,
  parsePaymentInfo,
  parseAllTuition,
  parseMoneyMmk,
  parseMoneyUsd,
};
