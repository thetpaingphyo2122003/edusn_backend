const path = require('path');

const BACKEND_ROOT = path.resolve(__dirname, '../../..');
const STATIC_ROOT = path.resolve(BACKEND_ROOT, '../edusn.co.uk');

const staticFile = (...parts) => path.join(STATIC_ROOT, ...parts);

module.exports = {
  BACKEND_ROOT,
  STATIC_ROOT,
  staticFile,
};
