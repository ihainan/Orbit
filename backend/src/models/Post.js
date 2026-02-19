import pool from '../config/database.js';

class Post {
  // Get all posts with pagination
  // viewMode: 'public' (public only), 'all' (show all), 'private' (private only)
  static async findAll(page = 1, limit = 20, viewMode = 'public') {
    const offset = (page - 1) * limit;

    // Build filter based on view mode
    let whisperFilter = '';
    if (viewMode === 'public') {
      whisperFilter = ' AND p.whisper_mode = false';
    } else if (viewMode === 'private') {
      whisperFilter = ' AND p.whisper_mode = true';
    }
    // viewMode === 'all' means no filter

    const countQuery = `SELECT COUNT(*) FROM posts p WHERE p.deleted_at IS NULL${whisperFilter}`;
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].count);

    const query = `
      SELECT
        p.id,
        p.user_id,
        p.avatar_id,
        p.content_type,
        p.text_content,
        p.metadata,
        p.reposted_from_id,
        p.repost_comment,
        p.created_at,
        p.updated_at,
        p.location_latitude,
        p.location_longitude,
        p.location_accuracy,
        p.location_address,
        p.location_city,
        p.location_province,
        p.location_district,
        p.whisper_mode,
        json_build_object(
          'id', a.id,
          'avatar_url', a.avatar_url
        ) as avatar,
        COALESCE(
          json_agg(
            json_build_object(
              'id', m.id,
              'media_type', m.media_type,
              'file_url', m.file_url,
              'is_external', m.is_external,
              'thumbnail_url', m.thumbnail_url,
              'file_size', m.file_size,
              'mime_type', m.mime_type
            ) ORDER BY m.id
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'
        ) as media,
        CASE
          WHEN p.reposted_from_id IS NOT NULL THEN
            json_build_object(
              'id', op.id,
              'user_id', op.user_id,
              'avatar_id', op.avatar_id,
              'content_type', op.content_type,
              'text_content', op.text_content,
              'metadata', op.metadata,
              'reposted_from_id', op.reposted_from_id,
              'repost_comment', op.repost_comment,
              'created_at', op.created_at,
              'avatar', json_build_object(
                'id', oa.id,
                'avatar_url', oa.avatar_url
              ),
              'media', COALESCE(
                (
                  SELECT json_agg(
                    json_build_object(
                      'id', om.id,
                      'media_type', om.media_type,
                      'file_url', om.file_url,
                      'is_external', om.is_external,
                      'thumbnail_url', om.thumbnail_url,
                      'file_size', om.file_size,
                      'mime_type', om.mime_type
                    ) ORDER BY om.id
                  )
                  FROM media om
                  WHERE om.post_id = op.id
                ),
                '[]'
              )
            )
          ELSE NULL
        END as reposted_post
      FROM posts p
      LEFT JOIN avatars a ON p.avatar_id = a.id
      LEFT JOIN media m ON p.id = m.post_id
      LEFT JOIN posts op ON p.reposted_from_id = op.id AND op.deleted_at IS NULL
      LEFT JOIN avatars oa ON op.avatar_id = oa.id
      WHERE p.deleted_at IS NULL${whisperFilter}
      GROUP BY p.id, a.id, a.avatar_url, op.id, op.reposted_from_id, op.repost_comment, oa.id, oa.avatar_url
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);

    return {
      posts: result.rows,
      pagination: {
        total,
        page,
        limit,
        hasMore: offset + limit < total
      }
    };
  }

  // Get single post by ID
  static async findById(id) {
    const query = `
      SELECT
        p.id,
        p.user_id,
        p.avatar_id,
        p.content_type,
        p.text_content,
        p.metadata,
        p.reposted_from_id,
        p.repost_comment,
        p.created_at,
        p.updated_at,
        p.location_latitude,
        p.location_longitude,
        p.location_accuracy,
        p.location_address,
        p.location_city,
        p.location_province,
        p.location_district,
        p.whisper_mode,
        json_build_object(
          'id', a.id,
          'avatar_url', a.avatar_url
        ) as avatar,
        COALESCE(
          json_agg(
            json_build_object(
              'id', m.id,
              'media_type', m.media_type,
              'file_url', m.file_url,
              'is_external', m.is_external,
              'thumbnail_url', m.thumbnail_url,
              'file_size', m.file_size,
              'mime_type', m.mime_type
            ) ORDER BY m.id
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'
        ) as media,
        CASE
          WHEN p.reposted_from_id IS NOT NULL THEN
            json_build_object(
              'id', op.id,
              'user_id', op.user_id,
              'avatar_id', op.avatar_id,
              'content_type', op.content_type,
              'text_content', op.text_content,
              'metadata', op.metadata,
              'reposted_from_id', op.reposted_from_id,
              'repost_comment', op.repost_comment,
              'created_at', op.created_at,
              'avatar', json_build_object(
                'id', oa.id,
                'avatar_url', oa.avatar_url
              ),
              'media', COALESCE(
                (
                  SELECT json_agg(
                    json_build_object(
                      'id', om.id,
                      'media_type', om.media_type,
                      'file_url', om.file_url,
                      'is_external', om.is_external,
                      'thumbnail_url', om.thumbnail_url,
                      'file_size', om.file_size,
                      'mime_type', om.mime_type
                    ) ORDER BY om.id
                  )
                  FROM media om
                  WHERE om.post_id = op.id
                ),
                '[]'
              )
            )
          ELSE NULL
        END as reposted_post
      FROM posts p
      LEFT JOIN avatars a ON p.avatar_id = a.id
      LEFT JOIN media m ON p.id = m.post_id
      LEFT JOIN posts op ON p.reposted_from_id = op.id AND op.deleted_at IS NULL
      LEFT JOIN avatars oa ON op.avatar_id = oa.id
      WHERE p.id = $1 AND p.deleted_at IS NULL
      GROUP BY p.id, a.id, a.avatar_url, op.id, op.reposted_from_id, op.repost_comment, oa.id, oa.avatar_url
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Create new post
  static async create(userId, contentType, textContent, metadata = {}, avatarId = null, mediaItems = [], location = null, whisperMode = false) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create the post
      const postQuery = `
        INSERT INTO posts (
          user_id, avatar_id, content_type, text_content, metadata,
          location_latitude, location_longitude, location_accuracy,
          location_address, location_city, location_province, location_district,
          whisper_mode
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const postResult = await client.query(postQuery, [
        userId,
        avatarId,
        contentType,
        textContent,
        JSON.stringify(metadata),
        location?.latitude || null,
        location?.longitude || null,
        location?.accuracy || null,
        location?.address || null,
        location?.city || null,
        location?.province || null,
        location?.district || null,
        whisperMode
      ]);

      const post = postResult.rows[0];

      // Create media entries if provided
      if (mediaItems && mediaItems.length > 0) {
        const mediaQuery = `
          INSERT INTO media (post_id, media_type, file_url, is_external, thumbnail_url, file_size, mime_type)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        for (const media of mediaItems) {
          await client.query(mediaQuery, [
            post.id,
            media.media_type,
            media.file_url,
            media.is_external || false,
            media.thumbnail_url || null,
            media.file_size || null,
            media.mime_type || null
          ]);
        }
      }

      await client.query('COMMIT');
      return post;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Update post
  static async update(id, contentType, textContent, metadata, mediaItems = null, whisperMode = null) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if this is a repost and if post exists and not deleted
      const checkQuery = 'SELECT reposted_from_id FROM posts WHERE id = $1 AND deleted_at IS NULL';
      const checkResult = await client.query(checkQuery, [id]);

      if (!checkResult.rows[0]) {
        await client.query('ROLLBACK');
        return null;
      }

      const isRepost = checkResult.rows[0]?.reposted_from_id !== null;

      // Update the post - if it's a repost, update repost_comment instead of text_content
      let postQuery, postParams;
      if (isRepost) {
        // For reposts, optionally update whisper_mode
        if (whisperMode !== null) {
          postQuery = `
            UPDATE posts
            SET repost_comment = $1, whisper_mode = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3 AND deleted_at IS NULL
            RETURNING *
          `;
          postParams = [textContent, whisperMode, id];
        } else {
          postQuery = `
            UPDATE posts
            SET repost_comment = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND deleted_at IS NULL
            RETURNING *
          `;
          postParams = [textContent, id];
        }
      } else {
        // For regular posts, optionally update whisper_mode
        if (whisperMode !== null) {
          postQuery = `
            UPDATE posts
            SET content_type = $1, text_content = $2, metadata = $3, whisper_mode = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5 AND deleted_at IS NULL
            RETURNING *
          `;
          postParams = [contentType, textContent, JSON.stringify(metadata), whisperMode, id];
        } else {
          postQuery = `
            UPDATE posts
            SET content_type = $1, text_content = $2, metadata = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4 AND deleted_at IS NULL
            RETURNING *
          `;
          postParams = [contentType, textContent, JSON.stringify(metadata), id];
        }
      }

      const postResult = await client.query(postQuery, postParams);

      const post = postResult.rows[0];
      if (!post) {
        await client.query('ROLLBACK');
        return null;
      }

      // If mediaItems is provided, replace all media
      if (mediaItems !== null) {
        // Delete existing media
        await client.query('DELETE FROM media WHERE post_id = $1', [id]);

        // Add new media
        if (mediaItems.length > 0) {
          const mediaQuery = `
            INSERT INTO media (post_id, media_type, file_url, is_external, thumbnail_url, file_size, mime_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;

          for (const media of mediaItems) {
            await client.query(mediaQuery, [
              id,
              media.media_type,
              media.file_url,
              media.is_external || false,
              media.thumbnail_url || null,
              media.file_size || null,
              media.mime_type || null
            ]);
          }
        }
      }

      await client.query('COMMIT');
      return post;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete post (soft delete)
  static async delete(id) {
    const query = 'UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Create a repost
  static async repost(userId, originalPostId, repostComment = null, avatarId = null) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify original post exists
      const originalPost = await this.findById(originalPostId);
      if (!originalPost) {
        throw new Error('Original post not found');
      }

      // Allow reposting any post (including reposts)
      // The reposted_from_id will point to the post being reposted
      // Inherit whisper_mode from the original post

      // Create the repost
      const postQuery = `
        INSERT INTO posts (user_id, avatar_id, content_type, text_content, metadata, reposted_from_id, repost_comment, whisper_mode)
        VALUES ($1, $2, 'repost', NULL, '{}', $3, $4, $5)
        RETURNING *
      `;

      const postResult = await client.query(postQuery, [
        userId,
        avatarId,
        originalPostId,
        repostComment,
        originalPost.whisper_mode
      ]);

      const post = postResult.rows[0];

      await client.query('COMMIT');
      return post;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get deleted posts (for recycle bin)
  static async findDeleted(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const countQuery = 'SELECT COUNT(*) FROM posts WHERE deleted_at IS NOT NULL';
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].count);

    const query = `
      SELECT
        p.id,
        p.user_id,
        p.avatar_id,
        p.content_type,
        p.text_content,
        p.metadata,
        p.reposted_from_id,
        p.repost_comment,
        p.created_at,
        p.updated_at,
        p.deleted_at,
        p.location_latitude,
        p.location_longitude,
        p.location_accuracy,
        p.location_address,
        p.location_city,
        p.location_province,
        p.location_district,
        p.whisper_mode,
        json_build_object(
          'id', a.id,
          'avatar_url', a.avatar_url
        ) as avatar,
        COALESCE(
          json_agg(
            json_build_object(
              'id', m.id,
              'media_type', m.media_type,
              'file_url', m.file_url,
              'is_external', m.is_external,
              'thumbnail_url', m.thumbnail_url,
              'file_size', m.file_size,
              'mime_type', m.mime_type
            ) ORDER BY m.id
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'
        ) as media,
        CASE
          WHEN p.reposted_from_id IS NOT NULL THEN
            json_build_object(
              'id', op.id,
              'user_id', op.user_id,
              'avatar_id', op.avatar_id,
              'content_type', op.content_type,
              'text_content', op.text_content,
              'metadata', op.metadata,
              'reposted_from_id', op.reposted_from_id,
              'repost_comment', op.repost_comment,
              'created_at', op.created_at,
              'avatar', json_build_object(
                'id', oa.id,
                'avatar_url', oa.avatar_url
              ),
              'media', COALESCE(
                (
                  SELECT json_agg(
                    json_build_object(
                      'id', om.id,
                      'media_type', om.media_type,
                      'file_url', om.file_url,
                      'is_external', om.is_external,
                      'thumbnail_url', om.thumbnail_url,
                      'file_size', om.file_size,
                      'mime_type', om.mime_type
                    ) ORDER BY om.id
                  )
                  FROM media om
                  WHERE om.post_id = op.id
                ),
                '[]'
              )
            )
          ELSE NULL
        END as reposted_post
      FROM posts p
      LEFT JOIN avatars a ON p.avatar_id = a.id
      LEFT JOIN media m ON p.id = m.post_id
      LEFT JOIN posts op ON p.reposted_from_id = op.id
      LEFT JOIN avatars oa ON op.avatar_id = oa.id
      WHERE p.deleted_at IS NOT NULL
      GROUP BY p.id, a.id, a.avatar_url, op.id, op.reposted_from_id, op.repost_comment, oa.id, oa.avatar_url
      ORDER BY p.deleted_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);

    return {
      posts: result.rows,
      pagination: {
        total,
        page,
        limit,
        hasMore: offset + limit < total
      }
    };
  }

  // Restore deleted post
  static async restore(id) {
    const query = 'UPDATE posts SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Permanently delete post (only for already soft-deleted posts)
  static async permanentlyDelete(id) {
    const query = 'DELETE FROM posts WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Search posts by keyword
  static async search(keyword, page = 1, limit = 20, viewMode = 'public') {
    const offset = (page - 1) * limit;
    const searchTerm = `%${keyword}%`;

    // Build filter based on view mode
    let whisperFilter = '';
    if (viewMode === 'public') {
      whisperFilter = ' AND p.whisper_mode = false';
    } else if (viewMode === 'private') {
      whisperFilter = ' AND p.whisper_mode = true';
    }
    // viewMode === 'all' means no filter

    // Count total matching posts
    const countQuery = `
      SELECT COUNT(DISTINCT p.id)
      FROM posts p
      LEFT JOIN posts op ON p.reposted_from_id = op.id AND op.deleted_at IS NULL
      WHERE p.deleted_at IS NULL${whisperFilter}
        AND (
          p.text_content ILIKE $1
          OR p.repost_comment ILIKE $1
          OR op.text_content ILIKE $1
          OR op.repost_comment ILIKE $1
        )
    `;
    const countResult = await pool.query(countQuery, [searchTerm]);
    const total = parseInt(countResult.rows[0].count);

    // Search posts
    const query = `
      SELECT
        p.id,
        p.user_id,
        p.avatar_id,
        p.content_type,
        p.text_content,
        p.metadata,
        p.reposted_from_id,
        p.repost_comment,
        p.created_at,
        p.updated_at,
        p.location_latitude,
        p.location_longitude,
        p.location_accuracy,
        p.location_address,
        p.location_city,
        p.location_province,
        p.location_district,
        p.whisper_mode,
        json_build_object(
          'id', a.id,
          'avatar_url', a.avatar_url
        ) as avatar,
        COALESCE(
          json_agg(
            json_build_object(
              'id', m.id,
              'media_type', m.media_type,
              'file_url', m.file_url,
              'is_external', m.is_external,
              'thumbnail_url', m.thumbnail_url,
              'file_size', m.file_size,
              'mime_type', m.mime_type
            ) ORDER BY m.id
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'
        ) as media,
        CASE
          WHEN p.reposted_from_id IS NOT NULL THEN
            json_build_object(
              'id', op.id,
              'user_id', op.user_id,
              'avatar_id', op.avatar_id,
              'content_type', op.content_type,
              'text_content', op.text_content,
              'metadata', op.metadata,
              'reposted_from_id', op.reposted_from_id,
              'repost_comment', op.repost_comment,
              'created_at', op.created_at,
              'avatar', json_build_object(
                'id', oa.id,
                'avatar_url', oa.avatar_url
              ),
              'media', COALESCE(
                (
                  SELECT json_agg(
                    json_build_object(
                      'id', om.id,
                      'media_type', om.media_type,
                      'file_url', om.file_url,
                      'is_external', om.is_external,
                      'thumbnail_url', om.thumbnail_url,
                      'file_size', om.file_size,
                      'mime_type', om.mime_type
                    ) ORDER BY om.id
                  )
                  FROM media om
                  WHERE om.post_id = op.id
                ),
                '[]'
              )
            )
          ELSE NULL
        END as reposted_post
      FROM posts p
      LEFT JOIN avatars a ON p.avatar_id = a.id
      LEFT JOIN media m ON p.id = m.post_id
      LEFT JOIN posts op ON p.reposted_from_id = op.id AND op.deleted_at IS NULL
      LEFT JOIN avatars oa ON op.avatar_id = oa.id
      WHERE p.deleted_at IS NULL${whisperFilter}
        AND (
          p.text_content ILIKE $1
          OR p.repost_comment ILIKE $1
          OR op.text_content ILIKE $1
          OR op.repost_comment ILIKE $1
        )
      GROUP BY p.id, a.id, a.avatar_url, op.id, op.reposted_from_id, op.repost_comment, oa.id, oa.avatar_url
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [searchTerm, limit, offset]);

    return {
      posts: result.rows,
      pagination: {
        total,
        page,
        limit,
        hasMore: offset + limit < total
      }
    };
  }
}

export default Post;
