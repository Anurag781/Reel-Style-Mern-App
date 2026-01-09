const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// POST /api/comments/  - create a comment (protected)
router.post('/', authMiddleware.authUserMiddleware, commentController.createComment);

// GET /api/comments/:foodId - list comments for a food
router.get('/:foodId', authMiddleware.authUserMiddleware, commentController.getComments);

// PATCH /api/comments/:commentId - edit a comment (protected, owner only)
router.patch('/:commentId', authMiddleware.authUserMiddleware, commentController.updateComment);

// DELETE /api/comments/:commentId - delete a comment (protected, owner only)
router.delete('/:commentId', authMiddleware.authUserMiddleware, commentController.deleteComment);

module.exports = router;
