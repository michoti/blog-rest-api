const Post = require('../models/Post');
const User = require('../models/User');
const mongoose = require('mongoose');
const errorHandler = require('../utils/errorHandling').withScope('PostController');

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *                 description: Category ID
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 post:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     author:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                     category:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
const createPost = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    // Validate input
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return errorHandler.handleValidationError('Title is required and must be a non-empty string', res);
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return errorHandler.handleValidationError('Content is required and must be a non-empty string', res);
    }
    if (category && !mongoose.isValidObjectId(category)) {
      return errorHandler.handleValidationError('Invalid category ID', res);
    }
    if (tags && (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string'))) {
      return errorHandler.handleValidationError('Tags must be an array of strings', res);
    }

    // Create and save post
    const post = new Post({
      title: title.trim(),
      content: content.trim(),
      author: req.user.userId,
      category: category || undefined,
      tags: tags || [],
    });

    await post.save();

    // Populate author and category for response
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username email')
      .populate('category', 'name');

    errorHandler.logSuccess('Post created', { postId: post._id, authorId: req.user.userId });
    res.status(201).json({
      message: 'Post created successfully',
      post: populatedPost,
    });
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res);
  }
};

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts with pagination and search
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of posts per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title or content
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category ID
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 *                       author:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
 *                       category:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 totalPosts:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 postsPerPage:
 *                   type: integer
 *       400:
 *         description: Validation error
 */
const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', tags = '' } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return errorHandler.handleValidationError('Page must be a positive number', res);
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return errorHandler.handleValidationError('Limit must be between 1 and 100', res);
    }

    // Build filter
    let filter = {};
    if (category) {
      if (!mongoose.isValidObjectId(category)) {
        return errorHandler.handleValidationError('Invalid category ID', res);
      }
      filter.category = category;
    }
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      if (tagArray.length === 0) {
        return errorHandler.handleValidationError('Tags must be a comma-separated list of non-empty strings', res);
      }
      filter.tags = { $in: tagArray };
    }
    if (search) {
      const regexSearch = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regexSearch },
        { content: regexSearch },
      ];
    }

    // Fetch posts with pagination
    const posts = await Post.find(filter)
      .populate('author', 'username email')
      .populate('category', 'name')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limitNum);

    errorHandler.logSuccess('Posts retrieved', { page: pageNum, limit: limitNum, totalPosts });
    res.json({
      message: 'Posts retrieved successfully',
      posts,
      totalPosts,
      totalPages,
      currentPage: pageNum,
      postsPerPage: limitNum,
    });
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res);
  }
};

/**
 * @swagger
 * /posts/{postId}:
 *   put:
 *     summary: Update an existing post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *                 description: Category ID
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 post:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     author:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                     category:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content, category, tags } = req.body;
    const userId = req.user.userId;

    // Validate postId
    if (!postId || !mongoose.isValidObjectId(postId)) {
      return errorHandler.handleValidationError('Invalid post ID', res);
    }

    // Validate input
    if (title && (typeof title !== 'string' || title.trim().length === 0)) {
      return errorHandler.handleValidationError('Title must be a non-empty string', res);
    }
    if (content && (typeof content !== 'string' || content.trim().length === 0)) {
      return errorHandler.handleValidationError('Content must be a non-empty string', res);
    }
    if (category && !mongoose.isValidObjectId(category)) {
      return errorHandler.handleValidationError('Invalid category ID', res);
    }
    if (tags && (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string'))) {
      return errorHandler.handleValidationError('Tags must be an array of strings', res);
    }

    // Fetch post
    const post = await Post.findById(postId);
    if (!post) {
      return errorHandler.handleNotFoundError('Post not found', res);
    }

    // Check authorization
    const user = await User.findById(userId);
    if (!user) {
      return errorHandler.handleNotFoundError('User not found', res);
    }
    if (post.author.toString() !== userId && user.role !== 'admin') {
      return errorHandler.handleAuthError('Not authorized to update this post', res);
    }

    // Update post
    post.title = title ? title.trim() : post.title;
    post.content = content ? content.trim() : post.content;
    post.category = category || post.category;
    post.tags = tags || post.tags;

    await post.save();

    // Populate author and category for response
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username email')
      .populate('category', 'name');

    errorHandler.logSuccess('Post updated', { postId, userId });
    res.json({
      message: 'Post updated successfully',
      post: populatedPost,
    });
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res);
  }
};

/**
 * @swagger
 * /posts/{postId}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // Validate postId
    if (!postId || !mongoose.isValidObjectId(postId)) {
      return errorHandler.handleValidationError('Invalid post ID', res);
    }

    // Fetch post
    const post = await Post.findById(postId);
    if (!post) {
      return errorHandler.handleNotFoundError('Post not found', res);
    }

    // Check authorization
    const user = await User.findById(userId);
    if (!user) {
      return errorHandler.handleNotFoundError('User not found', res);
    }
    if (post.author.toString() !== userId && user.role !== 'admin') {
      return errorHandler.handleAuthError('Not authorized to delete this post', res);
    }

    // Delete post
    await post.deleteOne();

    errorHandler.logSuccess('Post deleted', { postId, userId });
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res);
  }
};

module.exports = { createPost, getPosts, updatePost, deletePost };