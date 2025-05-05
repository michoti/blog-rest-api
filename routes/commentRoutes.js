const express = require('express');
const { createComment, getComments, getSingleComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Comment routes
router.post('/', protect, createComment); // Create a comment (authenticated)
router.get('/post/:postId', getComments); // Get all comments for a post (public)
router.get('/:commentId', getSingleComment); // Get a single comment by ID (public)
router.delete('/:commentId', protect, deleteComment); // Delete a comment by ID (authenticated)

module.exports = router;