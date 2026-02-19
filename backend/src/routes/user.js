import express from 'express';
import UserController from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);

export default router;
