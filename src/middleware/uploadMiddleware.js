// src/middleware/uploadFileMiddleware.js
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

// File filter for all allowed file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'text/plain',
        'text/csv',
        // Archives
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        // Audio
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        // Video
        'video/mp4', 'video/mpeg', 'video/quicktime'
    ];
    
    const extname = allowedTypes.some(type => 
        file.mimetype === type || file.mimetype.startsWith('image/')
    );
    
    if (extname) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
};

const uploadFile = multer({
    storage: storage,
    limits: { 
        fileSize: 20 * 1024 * 1024  // 20MB limit for files
    },
    fileFilter: fileFilter
});

module.exports = uploadFile;