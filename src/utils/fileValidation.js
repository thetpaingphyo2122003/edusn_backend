const path = require('path');

const IMAGE_TYPES = new Map([
    ['image/jpeg', ['.jpg', '.jpeg']],
    ['image/png', ['.png']],
    ['image/gif', ['.gif']],
    ['image/webp', ['.webp']],
]);

const VIDEO_TYPES = new Map([
    ['video/mp4', ['.mp4']],
    ['video/mpeg', ['.mpeg', '.mpg']],
    ['video/quicktime', ['.mov']],
    ['video/webm', ['.webm']],
]);

const DOCUMENT_TYPES = new Map([
    ['application/pdf', ['.pdf']],
    ['application/msword', ['.doc']],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', ['.docx']],
    ['application/vnd.ms-excel', ['.xls']],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ['.xlsx']],
    ['application/vnd.ms-powerpoint', ['.ppt']],
    ['application/vnd.openxmlformats-officedocument.presentationml.presentation', ['.pptx']],
    ['text/plain', ['.txt']],
    ['text/csv', ['.csv']],
    ['application/zip', ['.zip']],
    ['application/x-zip-compressed', ['.zip']],
    ['application/vnd.rar', ['.rar']],
    ['application/x-rar-compressed', ['.rar']],
    ['application/octet-stream', ['.rar']],
]);

const getExtension = (file) => path.extname(file?.originalname || '').toLowerCase();

const hasAllowedExtension = (file, allowedMap) => {
    const extensions = allowedMap.get(file?.mimetype);
    return Boolean(extensions && extensions.includes(getExtension(file)));
};

const buildValidationError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

const validateUploadedFile = (file, category = 'any') => {
    if (!file) {
        throw buildValidationError('No file provided');
    }

    if (file.mimetype === 'image/svg+xml' || getExtension(file) === '.svg') {
        throw buildValidationError('SVG uploads are not allowed');
    }

    const validators = {
        image: [IMAGE_TYPES],
        video: [VIDEO_TYPES],
        document: [DOCUMENT_TYPES],
        any: [IMAGE_TYPES, VIDEO_TYPES, DOCUMENT_TYPES],
    };

    const allowedMaps = validators[category] || validators.any;
    const isAllowed = allowedMaps.some((allowedMap) => hasAllowedExtension(file, allowedMap));

    if (!isAllowed) {
        throw buildValidationError('File type is not allowed');
    }

    return true;
};

module.exports = {
    DOCUMENT_TYPES,
    IMAGE_TYPES,
    VIDEO_TYPES,
    validateUploadedFile,
};
