import pool from '../config/database.js';

class Avatar {
  // Create new avatar
  static async create(userId, avatarUrl, isCurrent = false) {
    // If this is set as current, unset all other current avatars
    if (isCurrent) {
      await pool.query('UPDATE avatars SET is_current = false WHERE user_id = $1', [userId]);
    }

    const query = `
      INSERT INTO avatars (user_id, avatar_url, is_current)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await pool.query(query, [userId, avatarUrl, isCurrent]);
    return result.rows[0];
  }

  // Get all avatars for a user
  static async findByUserId(userId) {
    const query = `
      SELECT * FROM avatars
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Get current avatar
  static async getCurrent(userId) {
    const query = `
      SELECT * FROM avatars
      WHERE user_id = $1 AND is_current = true
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  // Set avatar as current
  static async setCurrent(id, userId) {
    // First, unset all current avatars for this user
    await pool.query('UPDATE avatars SET is_current = false WHERE user_id = $1', [userId]);

    // Then set this one as current
    const query = `
      UPDATE avatars
      SET is_current = true
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id, userId]);
    return result.rows[0] || null;
  }

  // Get avatar by ID
  static async findById(id) {
    const query = 'SELECT * FROM avatars WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
}

export default Avatar;
