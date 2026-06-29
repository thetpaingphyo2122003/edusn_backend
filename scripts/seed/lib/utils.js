const slugify = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const cleanText = (value = '') =>
  value
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();

const normalizeAssetPath = (src = '') => {
  if (!src) return null;
  const value = src.trim();
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/assets/')) return value;
  if (value.startsWith('assets/')) return `/${value}`;
  return value;
};

const extractStyleImage = (style = '') => {
  const match = style.match(/url\((['"]?)([^'")]+)\1\)/i);
  return match ? normalizeAssetPath(match[2]) : null;
};

const parseInstallments = (items = []) =>
  items.map((item, index) => ({
    number: index + 1,
    amount: item.amountMmk,
    amount_usd: item.amountUsd ?? null,
  }));

module.exports = {
  slugify,
  cleanText,
  normalizeAssetPath,
  extractStyleImage,
  parseInstallments,
};
