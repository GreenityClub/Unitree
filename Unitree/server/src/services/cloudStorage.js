const { v2: cloudinary } = require('cloudinary');
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class CloudStorageService {
  constructor() {
    this.isConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
    
    if (!this.isConfigured) {
      logger.warn('Cloudinary not configured - avatars will use local storage');
    }
  }

  /**
   * Upload avatar to Cloudinary
   */
  async uploadAvatar(filePath, userId) {
    if (!this.isConfigured) {
      throw new Error('Cloud storage not configured');
    }

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'unitree/avatars',
        public_id: `avatar-${userId}`,
        overwrite: true,
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      logger.info(`Avatar uploaded to Cloudinary: ${result.secure_url}`);
      return {
        url: result.secure_url,
        publicId: result.public_id
      };
    } catch (error) {
      logger.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload avatar to cloud storage');
    }
  }

  /**
   * Delete avatar from Cloudinary
   */
  async deleteAvatar(publicId) {
    if (!this.isConfigured) {
      return;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      logger.info(`Avatar deleted from Cloudinary: ${publicId}`);
      return result;
    } catch (error) {
      logger.error('Cloudinary delete error:', error);
      throw new Error('Failed to delete avatar from cloud storage');
    }
  }

  /**
   * Check if cloud storage is available
   */
  isAvailable() {
    return this.isConfigured;
  }
}

module.exports = new CloudStorageService(); 