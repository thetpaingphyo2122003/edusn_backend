// src/services/uploadService.js
const cloudinary = require('../config/cloudinary');
const sharp = require('sharp');

const uploadImage = async (file, folder = 'edusn') => {
    try {
        if (!file || !file.buffer) {
            throw new Error('No file provided');
        }
        
        let optimizedBuffer;
        let resourceType = 'image';
        
        if (file.mimetype === 'image/svg+xml') {
            optimizedBuffer = file.buffer;
            resourceType = 'image';
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

const uploadFile = async (file, folder = 'edusn') => {
    try {
        if (!file || !file.buffer) {
            throw new Error('No file provided');
        }
        
        // For videos, use uploadVideo function
        if (file.mimetype.startsWith('video/')) {
            return await uploadVideo(file, folder);
        }
        
        return new Promise((resolve, reject) => {
            const uploadOptions = {
                folder: folder,
                resource_type: 'auto',
                use_filename: true,
                unique_filename: true,
                flags: 'attachment'
            };
            
            if (file.mimetype === 'application/pdf') {
                uploadOptions.flags = 'attachment';
                uploadOptions.format = 'pdf';
            }
            
            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
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
                        original_filename: result.original_filename,
                        resource_type: result.resource_type
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