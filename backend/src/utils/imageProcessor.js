import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

class ImageProcessor {
  // Generate thumbnail for image
  static async generateThumbnail(imagePath, outputDir, maxWidth = 400) {
    try {
      const filename = path.basename(imagePath);
      const ext = path.extname(filename).toLowerCase();

      // Preserve original format for thumbnails
      const thumbnailPath = path.join(outputDir, 'thumbnails', `thumb_${filename}`);

      const image = sharp(imagePath).resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      });

      // Use appropriate format based on file extension
      if (ext === '.png') {
        await image.png({ quality: 80 }).toFile(thumbnailPath);
      } else if (ext === '.webp') {
        await image.webp({ quality: 80 }).toFile(thumbnailPath);
      } else if (ext === '.gif') {
        await image.gif().toFile(thumbnailPath);
      } else {
        // Default to jpeg for jpg/jpeg and other formats
        await image.jpeg({ quality: 80 }).toFile(thumbnailPath);
      }

      return thumbnailPath;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      console.error('Image path:', imagePath);
      console.error('Error details:', error.message);
      return null;
    }
  }

  // Get file info
  static async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();

      return {
        size: stats.size,
        ext
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }

  // Delete file
  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}

export default ImageProcessor;
