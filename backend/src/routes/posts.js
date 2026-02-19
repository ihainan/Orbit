import express from 'express';
import PostController from '../controllers/postController.js';

const router = express.Router();

router.get('/', PostController.getPosts);
router.get('/search', PostController.searchPosts);
router.get('/deleted', PostController.getDeletedPosts);
router.get('/:id', PostController.getPost);
router.post('/', PostController.createPost);
router.post('/:id/repost', PostController.repostPost);
router.post('/:id/restore', PostController.restorePost);
router.put('/:id', PostController.updatePost);
router.delete('/:id', PostController.deletePost);
router.delete('/:id/permanent', PostController.permanentlyDeletePost);

export default router;
