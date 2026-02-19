import pool from '../config/database.js';

class User {
  // Get user by ID
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Get user by username
  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0] || null;
  }

  // Get default user (for single-user app)
  static async getDefault() {
    const query = 'SELECT * FROM users ORDER BY id LIMIT 1';
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  // Update user profile
  static async update(id, username, email) {
    const query = `
      UPDATE users
      SET username = $1, email = $2
      WHERE id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [username, email, id]);
    return result.rows[0] || null;
  }
}

export default User;
