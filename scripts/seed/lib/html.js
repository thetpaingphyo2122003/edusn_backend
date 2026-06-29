const fs = require('fs');
const cheerio = require('cheerio');
const { staticFile } = require('./paths');

const loadHtml = (relativePath) => {
  const filePath = staticFile(relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Static HTML not found: ${filePath}`);
  }
  const html = fs.readFileSync(filePath, 'utf8');
  return cheerio.load(html, { decodeEntities: false });
};

module.exports = { loadHtml };
