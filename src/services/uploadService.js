// src/services/uploadService.js
const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('../config/cloudinary');
const sharp = require('sharp');

const uploadsRoot = path.join(__dirname, '../../uploads');

const buildLocalFilename = (originalname) => {
    const name = (originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(name).toLowerCase();
    const base = path.basename(name, ext) || 'file';
    const suffix = Date.now().toString(36);
    return ext ? `${base}_${suffix}${ext}` : `${base}_${suffix}`;
};

const buildPublicFileUrl = (baseUrl, relativePath) => {
    const base = (baseUrl || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');
    return `${base}/${relativePath.replace(/^\//, '')}`;
};

const saveChatDocumentLocally = async (file, folder = 'chat/files', baseUrl) => {
    const filename = buildLocalFilename(file.originalname);
    const diskDir = path.resolve(uploadsRoot, folder);
    if (!diskDir.startsWith(path.resolve(uploadsRoot))) {
        throw new Error('Invalid upload destination');
    }
    await fs.mkdir(diskDir, { recursive: true });
    await fs.writeFile(path.join(diskDir, filename), file.buffer);

    const relativePath = `uploads/${folder}/${filename}`;
    return {
        url: buildPublicFileUrl(baseUrl, relativePath),
        public_id: filename,
        bytes: file.size,
        format: path.extname(filename).slice(1) || null,
        original_filename: file.originalname,
        resource_type: 'local',
        mime_type: file.mimetype,
        storage: 'local',
    };
};

const uploadImage = async (file, folder = 'edusn') => {
    try {
        if (!file || !file.buffer) {
            throw new Error('No file provided');
        }
        
        let optimizedBuffer;
        let resourceType = 'image';
        
        if (file.mimetype === 'image/svg+xml') {
            throw new Error('SVG uploads are not allowed');
        } else if (file.mimetype.startsWith('image/')) {
            optimizedBuffer = await sharp(file.buffer)
                .resize(1200, 1200, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80 })
                .toBuffer();
        } else {
            optimizedBuffer = file.buffer;
        }
        
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: resourceType,
                    use_filename: true,
                    unique_filename: true
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary error:', error);
                        return reject(error);
                    }
                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id,
                        width: result.width,
                        height: result.height,
                        format: result.format,
                        original_filename: result.original_filename
                    });
                }
            );
            uploadStream.end(optimizedBuffer);
        });
    } catch (error) {
        console.error('Upload error:', error);
        throw new Error(`Image upload failed: ${error.message}`);
    }
};

// ✅ NEW: Upload video with 50MB limit
const uploadVideo = async (file, folder = 'edusn') => {
    try {
        if (!file || !file.buffer) {
            throw new Error('No file provided');
        }
        
        // Check file size (50MB = 50 * 1024 * 1024 bytes)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('Video size exceeds 50MB limit');
        }
        
        // Check if it's a video file
        if (!file.mimetype.startsWith('video/')) {
            throw new Error('File is not a video');
        }
        
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: 'video',
                    use_filename: true,
                    unique_filename: true,
                    eager: [
                        { width: 640, height: 360, crop: "pad", format: "mp4" },
                        { width: 480, height: 270, crop: "pad", format: "webm" }
                    ],
                    eager_async: true
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary video upload error:', error);
                        return reject(error);
                    }
                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id,
                        resource_type: result.resource_type,
                        duration: result.duration,
                        format: result.format,
                        original_filename: result.original_filename,
                        bytes: result.bytes,
                        width: result.width,
                        height: result.height,
                        playback_url: result.playback_url,
                        eager: result.eager
                    });
                }
            );
            uploadStream.end(file.buffer);
        });
    } catch (error) {
        console.error('Video upload error:', error);
        throw new Error(`Video upload failed: ${error.message}`);
    }
};

const uploadFile = async (file, folder = 'edusn', baseUrl) => {
    try {
        if (!file || !file.buffer) {
            throw new Error('No file provided');
        }

        if (file.mimetype.startsWith('video/')) {
            return await uploadVideo(file, folder);
        }

        const isImage = file.mimetype.startsWith('image/');
        if (!isImage) {
            const localFolder = folder.startsWith('chat/') ? folder : 'chat/files';
            return saveChatDocumentLocally(file, localFolder, baseUrl);
        }

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: 'image',
                    use_filename: true,
                    unique_filename: true,
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary error:', error);
                        return reject(error);
                    }
                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id,
                        bytes: result.bytes,
                        format: result.format,
                        original_filename: result.original_filename || file.originalname,
                        resource_type: result.resource_type,
                        mime_type: file.mimetype,
                        storage: 'cloudinary',
                    });
                }
            );
            uploadStream.end(file.buffer);
        });
    } catch (error) {
        console.error('Upload error:', error);
        throw new Error(`File upload failed: ${error.message}`);
    }
};

const deleteImage = async (publicId) => {
    try {
        if (!publicId) return null;
        return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Delete error:', error);
        throw new Error(`Image deletion failed: ${error.message}`);
    }
};

const deleteVideo = async (publicId) => {
    try {
        if (!publicId) return null;
        return await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    } catch (error) {
        console.error('Video delete error:', error);
        throw new Error(`Video deletion failed: ${error.message}`);
    }
};

module.exports = { uploadImage, uploadVideo, uploadFile, deleteImage, deleteVideo };