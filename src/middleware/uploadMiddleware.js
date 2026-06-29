// src/middleware/uploadFileMiddleware.js
const multer = require('multer');
const { validateUploadedFile } = require('../utils/fileValidation');

const storage = multer.memoryStorage();

// File filter for all allowed file types
const fileFilter = (req, file, cb) => {
    try {
        validateUploadedFile(file, 'any');
        cb(null, true);
    } catch (error) {
        cb(error);
    }
};

const uploadFile = multer({
    storage: storage,
    limits: { 
        fileSize: 100 * 1024 * 1024  // 100MB limit for files
    },
    fileFilter: fileFilter
});

module.exports = uploadFile;