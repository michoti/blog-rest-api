const express = require('express');
const { createPost, getPosts, updatePost, deletePost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Post routes
router.post('/', protect, createPost); // Create a post (authenticated)
router.get('/', getPosts); // Get all posts with pagination and search (public)
router.put('/:postId', protect, updatePost); // Update a post (authenticated)
router.delete('/:postId', protect, deletePost); // Delete a post (authenticated)

module.exports = router;