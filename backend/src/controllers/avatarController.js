import Avatar from '../models/Avatar.js';
import User from '../models/User.js';

class AvatarController {
  // Get all avatars
  static async getAvatars(req, res, next) {
    try {
      const user = await User.getDefault();

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const avatars = await Avatar.findByUserId(user.id);
      res.json(avatars);
    } catch (error) {
      next(error);
    }
  }

  // Upload new avatar
  static async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const user = await User.getDefault();

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const { set_current } = req.body;

      const avatar = await Avatar.create(
        user.id,
        avatarUrl,
        set_current === 'true' || set_current === true
      );

      res.status(201).json(avatar);
    } catch (error) {
      next(error);
    }
  }

  // Set avatar as current
  static async setCurrentAvatar(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.getDefault();

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const avatar = await Avatar.setCurrent(id, user.id);

      if (!avatar) {
        return res.status(404).json({ error: 'Avatar not found' });
      }

      res.json(avatar);
    } catch (error) {
      next(error);
    }
  }

  // Get current avatar
  static async getCurrentAvatar(req, res, next) {
    try {
      const user = await User.getDefault();

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const avatar = await Avatar.getCurrent(user.id);

      if (!avatar) {
        return res.status(404).json({ error: 'No current avatar set' });
      }

      res.json(avatar);
    } catch (error) {
      next(error);
    }
  }
}

export default AvatarController;
