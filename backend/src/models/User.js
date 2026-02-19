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

  // Ensure a default user exists (called on app startup)
  static async ensureDefault() {
    const existing = await pool.query('SELECT id FROM users LIMIT 1');
    if (existing.rows.length > 0) return;

    const username = process.env.DEFAULT_USERNAME;
    const email = process.env.DEFAULT_EMAIL;

    if (!username || !email) {
      throw new Error(
        'No user found in database. Set DEFAULT_USERNAME and DEFAULT_EMAIL to create the default user on first run.'
      );
    }

    await pool.query('INSERT INTO users (username, email) VALUES ($1, $2)', [username, email]);
    console.log(`Created default user: ${username} <${email}>`);
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
