import pool from '../config/database.js';

class Media {
  // Create media entry
  static async create(postId, mediaType, fileUrl, isExternal, thumbnailUrl, fileSize, mimeType) {
    const query = `
      INSERT INTO media (post_id, media_type, file_url, is_external, thumbnail_url, file_size, mime_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      postId,
      mediaType,
      fileUrl,
      isExternal,
      thumbnailUrl,
      fileSize,
      mimeType
    ]);

    return result.rows[0];
  }

  // Find media by post ID
  static async findByPostId(postId) {
    const query = 'SELECT * FROM media WHERE post_id = $1 ORDER BY id';
    const result = await pool.query(query, [postId]);
    return result.rows;
  }

  // Find media by ID
  static async findById(id) {
    const query = 'SELECT * FROM media WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Delete media
  static async delete(id) {
    const query = 'DELETE FROM media WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Delete all media for a post
  static async deleteByPostId(postId) {
    const query = 'DELETE FROM media WHERE post_id = $1 RETURNING *';
    const result = await pool.query(query, [postId]);
    return result.rows;
  }
}

export default Media;
