const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const logger = require('../utils/logger');

// =================================================================
// ==                   CLOUDINARY CONFIGURATION                  ==
// =================================================================

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info('Cloudinary configured successfully.');
} else {
  logger.warn('Cloudinary not configured. File uploads will default to local storage.');
}

// =================================================================
// ==                     MULTER STORAGE SETUP                    ==
// =================================================================

let storage;

if (isConfigured) {
  /**
   * Cloudinary storage engine for Multer.
   * Uploads files directly to Cloudinary, avoiding local temporary storage.
   */
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'unitree/avatars',
      public_id: (req, file) => `avatar-${req.user._id}`,
      overwrite: true,
      transformation: [
        { width: 250, height: 250, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
    },
  });
} else {
  /**
   * Local disk storage engine for Multer (fallback).
   * Saves files to the 'uploads/avatars' directory.
   */
  storage = multer.diskStorage({
    destination: 'uploads/avatars',
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname);
      cb(null, `avatar-${req.user._id}${extension}`);
    },
  });
}

/**
 * Multer middleware for handling file uploads.
 * It uses the configured storage (Cloudinary or local) and sets file filters.
 */
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error(`File upload only supports the following filetypes: ${filetypes}`));
  }
});


// =================================================================
// ==                     SERVICE EXPORTS                       ==
// =================================================================

module.exports = {
  upload,
  isAvailable: () => isConfigured,
}; 