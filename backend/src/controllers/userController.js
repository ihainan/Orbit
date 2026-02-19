import User from '../models/User.js';
import Avatar from '../models/Avatar.js';

class UserController {
  // Get user profile
  static async getProfile(req, res, next) {
    try {
      // For single-user app, get the default user
      const user = await User.getDefault();

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get current avatar
      const currentAvatar = await Avatar.getCurrent(user.id);

      res.json({
        ...user,
        current_avatar: currentAvatar
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user profile
  static async updateProfile(req, res, next) {
    try {
      const { username, email } = req.body;

      if (!username || !email) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'username and email are required'
        });
      }

      const user = await User.getDefault();

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = await User.update(user.id, username, email);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
