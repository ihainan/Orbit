import Media from '../models/Media.js';
import ImageProcessor from '../utils/imageProcessor.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MediaController {
  // Upload media
  static async uploadMedia(req, res, next) {
    console.log('=== Upload media request ===');
    console.log('File:', req.file);

    try {
      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = req.file;
      console.log('Processing file:', file.originalname, 'Type:', file.mimetype);

      const mediaType = file.mimetype.startsWith('image/') ? 'image'
        : file.mimetype.startsWith('video/') ? 'video'
        : file.mimetype.startsWith('audio/') ? 'audio'
        : 'unknown';

      // Generate thumbnail for images
      let thumbnailPath = null;
      if (mediaType === 'image') {
        console.log('Generating thumbnail for image...');
        const uploadDir = path.join(__dirname, '../../uploads');
        thumbnailPath = await ImageProcessor.generateThumbnail(file.path, uploadDir);
        console.log('Thumbnail generated:', thumbnailPath);
      }

      // For now, we'll return file info without creating DB entry
      // DB entry will be created when post is created
      const response = {
        filename: file.filename,
        path: file.path,
        media_type: mediaType,
        file_url: `/uploads/${path.basename(path.dirname(file.path))}/${file.filename}`,
        thumbnail_url: thumbnailPath ? `/uploads/thumbnails/thumb_${file.filename}` : null,
        file_size: file.size,
        mime_type: file.mimetype
      };

      console.log('Sending response:', response);
      res.status(201).json(response);
    } catch (error) {
      console.error('=== Error in uploadMedia ===');
      console.error('Error:', error);
      console.error('Stack:', error.stack);
      next(error);
    }
  }

  // Delete media
  static async deleteMedia(req, res, next) {
    try {
      const { id } = req.params;
      const media = await Media.findById(id);

      if (!media) {
        return res.status(404).json({ error: 'Media not found' });
      }

      // Delete file from filesystem if it's not external
      if (!media.is_external) {
        const filePath = path.join(__dirname, '../../', media.file_url);
        await ImageProcessor.deleteFile(filePath);

        if (media.thumbnail_url) {
          const thumbnailPath = path.join(__dirname, '../../', media.thumbnail_url);
          await ImageProcessor.deleteFile(thumbnailPath);
        }
      }

      // Delete from database
      await Media.delete(id);

      res.json({ message: 'Media deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Get media by post
  static async getMediaByPost(req, res, next) {
    try {
      const { postId } = req.params;
      const media = await Media.findByPostId(postId);
      res.json(media);
    } catch (error) {
      next(error);
    }
  }
}

export default MediaController;
