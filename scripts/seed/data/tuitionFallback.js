const CAMPUS_FALLBACK = [
  {
    title: 'Year 1 to 3',
    totalMmk: 5300000,
    totalUsd: 950.9,
    secondaryMmk: 700000,
    secondaryUsd: 51,
    installments: [
      { amountMmk: 2120000, amountUsd: 475.5 },
      { amountMmk: 1590000, amountUsd: 475.5 },
      { amountMmk: 1590000, amountUsd: 475.5 },
    ],
  },
  {
    title: 'Year 4 to 6',
    totalMmk: 5900000,
    totalUsd: 1288.3,
    secondaryMmk: 700000,
    secondaryUsd: 51,
    installments: [
      { amountMmk: 2360000, amountUsd: 644 },
      { amountMmk: 1770000, amountUsd: 644 },
      { amountMmk: 1770000, amountUsd: 644 },
    ],
  },
  {
    title: 'Year 7',
    totalMmk: 6400000,
    totalUsd: 1134.9,
    secondaryMmk: 700000,
    secondaryUsd: 51,
    installments: [
      { amountMmk: 2560000, amountUsd: 567.5 },
      { amountMmk: 1920000, amountUsd: 567.5 },
      { amountMmk: 1920000, amountUsd: 567.5 },
    ],
  },
  {
    title: 'Year 8',
    totalMmk: 6600000,
    totalUsd: 1349.7,
    secondaryMmk: 700000,
    secondaryUsd: 51,
    installments: [
      { amountMmk: 2640000, amountUsd: 675 },
      { amountMmk: 1980000, amountUsd: 675 },
      { amountMmk: 1980000, amountUsd: 675 },
    ],
  },
  {
    title: 'Year 9',
    totalMmk: 6900000,
    totalUsd: 1442,
    secondaryMmk: 700000,
    secondaryUsd: 51,
    installments: [
      { amountMmk: 2760000, amountUsd: 721 },
      { amountMmk: 2070000, amountUsd: 721 },
      { amountMmk: 2070000, amountUsd: 721 },
    ],
  },
];

const VIRTUAL_FALLBACK = [
  {
    title: 'Year 1 to 3',
    totalMmk: 3500000,
    totalUsd: 800,
    secondaryMmk: 170000,
    secondaryUsd: 51,
    installments: [
      { amountMmk: 1400000, amountUsd: 138 },
      { amountMmk: 700000, amountUsd: 107 },
      { amountMmk: 700000, amountUsd: 107 },
      { amountMmk: 700000, amountUsd: 107 },
    ],
  },
  {
    title: 'Year 4 to 6',
    totalMmk: 4200000,
    totalUsd: 960,
    secondaryMmk: 170000,
    secondaryUsd: 51,
    installments: [
      { amountMmk: 1680000, amountUsd: 166 },
      { amountMmk: 840000, amountUsd: 128 },
      { amountMmk: 840000, amountUsd: 128 },
      { amountMmk: 840000, amountUsd: 128 },
    ],
  },
];

const IGCSE_FALLBACK = [
  {
    title: 'GCSE O Level',
    program_name: 'GCSE O Level',
    totalMmk: 11000000,
    materialMmk: 700000,
    installments: [
      { amountMmk: 4400000 },
      { amountMmk: 2200000 },
      { amountMmk: 2200000 },
      { amountMmk: 2200000 },
    ],
  },
  {
    title: 'A Level',
    program_name: 'A Level',
    totalMmk: 13500000,
    materialMmk: 700000,
    installments: [
      { amountMmk: 5400000 },
      { amountMmk: 2700000 },
      { amountMmk: 2700000 },
      { amountMmk: 2700000 },
    ],
  },
];

module.exports = { CAMPUS_FALLBACK, VIRTUAL_FALLBACK, IGCSE_FALLBACK };
