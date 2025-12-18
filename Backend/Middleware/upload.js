// middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Enhanced uploads directory setup
const uploadsDir = path.join(__dirname, '../uploads');
try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('✅ Created uploads directory:', uploadsDir);
    } else {
        console.log('✅ Uploads directory exists:', uploadsDir);
    }
} catch (error) {
    console.error('❌ Failed to create uploads directory:', error);
    throw error;
}

// Enhanced storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log('📁 Saving file to:', uploadsDir);
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Create safe filename with original extension
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueName = `package-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(safeName)}`;
        console.log('📄 Generated filename:', uniqueName);
        cb(null, uniqueName);
    }
});

// Enhanced file filter
const fileFilter = (req, file, cb) => {
    console.log('🔍 Checking file type:', file.mimetype, 'Original name:', file.originalname);
    
    if (file.mimetype.startsWith('image/')) {
        console.log('✅ File type accepted');
        cb(null, true);
    } else {
        console.log('❌ File type rejected:', file.mimetype);
        cb(new Error('Only image files are allowed! Supported formats: JPEG, PNG, GIF'), false);
    }
};

// Create multer instance with enhanced options
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1 // Only one file
    }
});

// Enhanced debugging
console.log('\n=== MULTER CONFIGURATION ===');
console.log('🔄 Multer instance created successfully');
console.log('📁 Upload directory:', uploadsDir);
console.log('📏 Max file size: 5MB');
console.log('🎯 Allowed types: image/*');
console.log('🔧 Methods available:');
console.log('   - upload.single:', typeof upload.single);
console.log('   - upload.array:', typeof upload.array);
console.log('   - upload.fields:', typeof upload.fields);
console.log('   - upload.none:', typeof upload.none);
console.log('============================\n');

// Test the single method exists and is callable
try {
    // This is just a test to verify the method exists
    if (typeof upload.single === 'function') {
        console.log('✅ upload.single is a callable function');
    } else {
        console.log('❌ upload.single is not a function');
    }
} catch (error) {
    console.error('❌ Error testing upload.single:', error);
}

// Export with additional validation
module.exports = {
    upload,
    // Helper method for single file upload
    single: (fieldName) => {
        console.log(`🔄 Creating single upload middleware for field: ${fieldName}`);
        const middleware = upload.single(fieldName);
        
        // Add error handling wrapper
        return (req, res, next) => {
            middleware(req, res, (err) => {
                if (err) {
                    console.error('❌ Multer upload error:', err);
                    if (err instanceof multer.MulterError) {
                        if (err.code === 'LIMIT_FILE_SIZE') {
                            return res.status(400).json({
                                success: false,
                                message: 'File too large. Maximum size is 5MB.'
                            });
                        }
                        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                            return res.status(400).json({
                                success: false,
                                message: `Unexpected field. Use '${fieldName}' for file upload.`
                            });
                        }
                    }
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }
                next();
            });
        };
    },
    // Direct access to upload object
    multerInstance: upload
};

// Also export the upload object directly for backward compatibility
module.exports.default = upload;