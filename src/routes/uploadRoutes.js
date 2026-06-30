// src/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadImage, uploadVideo, uploadFile } = require('../services/uploadService');
const upload = require('../middleware/uploadMiddleware');
const uploadFileMiddleware = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/securityMiddleware');
const { validateUploadedFile } = require('../utils/fileValidation');
const multer = require('multer');

const getRequestBaseUrl = (req) =>
    (process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

// Configure multer for larger file size (100MB)
const videoUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        try {
            validateUploadedFile(file, 'any');
            cb(null, true);
        } catch (error) {
            cb(error);
        }
    }
});

const sendUploadError = (res) =>
    res.status(500).json({ success: false, message: 'We could not send your file. Please try again.' });

// Upload image - max 10MB
router.post('/image', protect, uploadLimiter, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please choose a photo to send.' });
        }
        validateUploadedFile(req.file, 'image');
        
        const result = await uploadImage(req.file, 'chat/images');
        res.json({ success: true, url: result.url, data: result });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : 'We could not send your photo. Please try again.',
        });
    }
});

// ✅ NEW: Upload video - max 100MB
router.post('/video', protect, uploadLimiter, videoUpload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please choose a video to send.' });
        }
        
        // Check file size
        if (req.file.size > 100 * 1024 * 1024) {
            return res.status(400).json({ 
                success: false, 
                message: 'This video is too large to send. Please choose one smaller than 100 MB.' 
            });
        }
        
        validateUploadedFile(req.file, 'video');
        
        const result = await uploadVideo(req.file, 'chat/videos');
        res.json({ 
            success: true, 
            url: result.url, 
            type: 'video',
            data: result 
        });
    } catch (error) {
        console.error('Video upload error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : 'We could not send your video. Please try again.',
        });
    }
});

// Upload file (documents, PDFs, etc.)
router.post('/file', protect, uploadLimiter, uploadFileMiddleware.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please choose a file to send.' });
        }
        validateUploadedFile(req.file, 'document');
        
        const result = await uploadFile(req.file, 'chat/files', getRequestBaseUrl(req));
        res.json({ success: true, url: result.url, data: result });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : 'We could not send your file. Please try again.',
        });
    }
});

// Alternative: Single unified upload endpoint (supports images, videos, files)
router.post('/', protect, uploadLimiter, videoUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please choose a file to send.' });
        }
        
        validateUploadedFile(req.file, 'any');

        const isImage = req.file.mimetype.startsWith('image/');
        const isVideo = req.file.mimetype.startsWith('video/');
        
        let result;
        if (isImage) {
            result = await uploadImage(req.file, 'chat/uploads');
        } else if (isVideo) {
            // Check video size
            if (req.file.size > 100 * 1024 * 1024) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'This video is too large to send. Please choose one smaller than 100 MB.' 
                });
            }
            result = await uploadVideo(req.file, 'chat/uploads');
        } else {
            result = await uploadFile(req.file, 'chat/uploads', getRequestBaseUrl(req));
        }
        
        res.json({ 
            success: true, 
            url: result.url, 
            type: isImage ? 'image' : (isVideo ? 'video' : 'file'),
            data: result 
        });
    } catch (error) {
        console.error('Upload error:', error);
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        sendUploadError(res);
    }
});

module.exports = router;