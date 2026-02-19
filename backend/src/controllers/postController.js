import Post from '../models/Post.js';
import Media from '../models/Media.js';
import Avatar from '../models/Avatar.js';
import { reverseGeocode } from '../services/geocodingService.js';

class PostController {
  // Get all posts
  static async getPosts(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const viewMode = req.query.view_mode || 'public'; // 'public', 'all', or 'private'

      const result = await Post.findAll(page, limit, viewMode);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get single post
  static async getPost(req, res, next) {
    try {
      const { id } = req.params;
      const post = await Post.findById(id);

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.json(post);
    } catch (error) {
      next(error);
    }
  }

  // Create post
  static async createPost(req, res, next) {
    try {
      const { user_id, content_type, text_content, metadata, media_items, location, whisper_mode } = req.body;

      // Validate required fields
      if (!user_id || !content_type) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'user_id and content_type are required'
        });
      }

      // Get current avatar for this user
      const currentAvatar = await Avatar.getCurrent(user_id);
      const avatarId = currentAvatar ? currentAvatar.id : null;

      // Handle location if provided
      let locationData = null;
      if (location && location.latitude && location.longitude) {
        // If address info not provided, do reverse geocoding
        if (!location.address || !location.city) {
          const geocodeResult = await reverseGeocode(location.latitude, location.longitude);

          if (geocodeResult) {
            locationData = {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy || null,
              address: geocodeResult.formatted_address,
              city: geocodeResult.city || geocodeResult.province, // Fallback to province for municipalities
              province: geocodeResult.province,
              district: geocodeResult.district
            };
          } else {
            // If geocoding fails, still save coordinates
            locationData = {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy || null,
              address: location.address || null,
              city: location.city || null,
              province: location.province || null,
              district: location.district || null
            };
          }
        } else {
          // Use provided address info
          locationData = {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy || null,
            address: location.address,
            city: location.city,
            province: location.province || null,
            district: location.district || null
          };
        }
      }

      // Create post with media items and location
      const post = await Post.create(
        user_id,
        content_type,
        text_content || null,
        metadata || {},
        avatarId,
        media_items || [],
        locationData,
        whisper_mode || false
      );

      // Fetch complete post with media
      const completePost = await Post.findById(post.id);
      res.status(201).json(completePost);
    } catch (error) {
      next(error);
    }
  }

  // Update post
  static async updatePost(req, res, next) {
    try {
      const { id } = req.params;
      const { content_type, text_content, metadata, media_items, whisper_mode } = req.body;

      const post = await Post.update(
        id,
        content_type,
        text_content,
        metadata || {},
        media_items !== undefined ? media_items : null,
        whisper_mode !== undefined ? whisper_mode : null
      );

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const completePost = await Post.findById(id);
      res.json(completePost);
    } catch (error) {
      next(error);
    }
  }

  // Delete post
  static async deletePost(req, res, next) {
    try {
      const { id } = req.params;
      const post = await Post.delete(id);

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.json({ message: 'Post deleted successfully', post });
    } catch (error) {
      next(error);
    }
  }

  // Repost a post
  static async repostPost(req, res, next) {
    try {
      const { id } = req.params; // Original post ID
      const { user_id, repost_comment } = req.body;

      // Validate required fields
      if (!user_id) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'user_id is required'
        });
      }

      // Get current avatar for this user
      const currentAvatar = await Avatar.getCurrent(user_id);
      const avatarId = currentAvatar ? currentAvatar.id : null;

      // Create repost
      const post = await Post.repost(user_id, id, repost_comment || null, avatarId);

      // Fetch complete post with original post data
      const completePost = await Post.findById(post.id);
      res.status(201).json(completePost);
    } catch (error) {
      if (error.message === 'Original post not found') {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  // Search posts
  static async searchPosts(req, res, next) {
    try {
      const { q } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const viewMode = req.query.view_mode || 'public'; // 'public', 'all', or 'private'

      if (!q || q.trim() === '') {
        return res.status(400).json({
          error: 'Missing search query',
          message: 'Query parameter "q" is required'
        });
      }

      const result = await Post.search(q.trim(), page, limit, viewMode);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get deleted posts (recycle bin)
  static async getDeletedPosts(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await Post.findDeleted(page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Restore deleted post
  static async restorePost(req, res, next) {
    try {
      const { id } = req.params;
      const post = await Post.restore(id);

      if (!post) {
        return res.status(404).json({ error: 'Post not found or already restored' });
      }

      res.json({ message: 'Post restored successfully', post });
    } catch (error) {
      next(error);
    }
  }

  // Permanently delete post
  static async permanentlyDeletePost(req, res, next) {
    try {
      const { id } = req.params;
      const post = await Post.permanentlyDelete(id);

      if (!post) {
        return res.status(404).json({ error: 'Post not found in recycle bin' });
      }

      res.json({ message: 'Post permanently deleted', post });
    } catch (error) {
      next(error);
    }
  }
}

export default PostController;
