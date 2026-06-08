require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const app = express();

// 1. CLOUDINARY CONFIGURATION
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. PRE-FLIGHT CONNECTION TEST (Runs on startup)
const testCloudinary = async () => {
    try {
        await cloudinary.api.ping();
        console.log("✅ CLOUDINARY: Connection verified successfully.");
    } catch (error) {
        console.error("❌ CLOUDINARY ERROR: Authentication failed!");
        console.error("Reason:", error.message);
        console.log("Check if your API_KEY and API_SECRET match exactly.");
    }
};
testCloudinary();

// 3. MULTER STORAGE SETUP
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// 4. THE UPLOAD ROUTE
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        // Log the file details for debugging in the console
        console.log('Incoming file:', req.file ? req.file.originalname : 'No file');

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file provided' });
        }

        // Convert buffer to Base64 String
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        // Upload using the DataURI method (More stable than upload_stream)
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'test_uploads',
            resource_type: 'auto'
        });

        console.log('✅ Upload Success:', result.secure_url);

        res.json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id
        });

    } catch (error) {
        console.error('SERVER ERROR:', error);

        // Send detailed error back to Postman to see exactly what failed
        res.status(error.http_code || 500).json({
            success: false,
            message: error.message,
            cloudinary_details: error
        });
    }
});

// 5. SERVER STARTUP
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 SERVER RUNNING ON PORT ${PORT}`);
    console.log(`📡 TEST THE ROUTE AT: http://localhost:${PORT}/upload\n`);
});