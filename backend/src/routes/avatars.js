import express from 'express';
import AvatarController from '../controllers/avatarController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', AvatarController.getAvatars);
router.get('/current', AvatarController.getCurrentAvatar);
router.post('/', upload.single('avatar'), AvatarController.uploadAvatar);
router.put('/:id/current', AvatarController.setCurrentAvatar);

export default router;
