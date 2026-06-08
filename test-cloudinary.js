// test-cloudinary.js
require('dotenv').config();
const cloudinary = require('./src/config/cloudinary');

cloudinary.api.ping((error, result) => {
    if (error) {
        console.error('❌ Cloudinary connection failed:', error.message);
    } else {
        console.log('✅ Cloudinary connected successfully!', result);
    }
});