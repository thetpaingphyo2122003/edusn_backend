const Tuition = require('../../../src/models/Tuition');
const TuitionSettings = require('../../../src/models/TuitionSettings');
const { defaultCategorySettings } = require('../../../src/models/TuitionSettings');
const { parseAllTuition } = require('../parsers/tuition');
const { parseInstallments } = require('../lib/utils');

const buildFeeDoc = (item, category, displayOrder) => {
  const isGcse = category === 'gcse_a_level';

  return {
    type: 'fee',
    category,
    year_level: isGcse ? null : item.title,
    program_name: isGcse ? item.program_name : item.title,
    total_fees_mmk: item.totalMmk,
    total_fees_usd: item.totalUsd ?? null,
    material_fees_mmk: item.materialMmk ?? 0,
    material_fees_usd: item.materialUsd ?? null,
    microsoft_fees_mmk: category === 'virtual' ? item.secondaryMmk ?? 0 : 0,
    microsoft_fees_usd: category === 'virtual' ? item.secondaryUsd ?? null : null,
    installments: parseInstallments(item.installments || []),
    scholarship_note: item.scholarship_note || null,
    display_order: displayOrder,
    status: 'active',
  };
};

const upsertPageSettings = async (parsedSettings) => {
  const payload = {};

  Object.entries(parsedSettings).forEach(([category, settings]) => {
    payload[category] = {
      ...defaultCategorySettings[category],
      ...settings,
    };
  });

  const existing = await TuitionSettings.findOne();
  if (!existing) {
    await TuitionSettings.create(payload);
    return;
  }

  Object.entries(payload).forEach(([category, settings]) => {
    existing[category] = { ...existing[category]?.toObject?.(), ...settings };
  });
  await existing.save();
};

const seedTuition = async () => {
  const { feePages, payment, settings } = parseAllTuition();

  const feeDocs = [];
  feePages.forEach((page) => {
    page.items.forEach((item, index) => {
      feeDocs.push(buildFeeDoc(item, page.category, index + 1));
    });
  });

  if (settings.gcse_a_level?.scholarship_note) {
    feeDocs.forEach((doc) => {
      if (doc.category === 'gcse_a_level') {
        doc.scholarship_note = settings.gcse_a_level.scholarship_note;
      }
    });
  }

  if (settings.gcse_a_level?.installment_note) {
    feeDocs.forEach((doc) => {
      if (doc.category === 'gcse_a_level') {
        doc.installment_note = settings.gcse_a_level.installment_note;
      }
    });
  }

  await Tuition.deleteMany({});
  await Tuition.insertMany([
    ...feeDocs,
    {
      type: 'payment_info',
      bank_accounts: payment.bank_accounts,
      status: 'active',
    },
  ]);
  await upsertPageSettings(settings);

  const counts = feePages.reduce((acc, page) => {
    acc[page.category] = page.items.length;
    return acc;
  }, {});

  console.log(`  tuition fees: ${feeDocs.length} (from static HTML)`);
  Object.entries(counts).forEach(([category, count]) => {
    console.log(`    - ${category}: ${count} plans`);
  });
  console.log(`  payment accounts: ${payment.bank_accounts.length}`);

  return feeDocs.length;
};

module.exports = seedTuition;
