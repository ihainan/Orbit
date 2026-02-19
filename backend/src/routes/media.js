import express from 'express';
import MediaController from '../controllers/mediaController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Add error handling for multer
router.post('/upload', (req, res, next) => {
  console.log('=== Received upload request ===');
  console.log('Content-Type:', req.headers['content-type']);

  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('=== Multer error ===');
      console.error('Error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      return next(err);
    }
    next();
  });
}, MediaController.uploadMedia);

router.delete('/:id', MediaController.deleteMedia);
router.get('/post/:postId', MediaController.getMediaByPost);

export default router;
