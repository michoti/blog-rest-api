const Comment = require('../models/Comment');
const User = require('../models/User');
const mongoose = require('mongoose');
const errorHandler = require('../utils/errorHandling').withScope('CommentController');

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - content
 *             properties:
 *               postId:
 *                 type: string
 *                 description: Post ID
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 comment:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     post:
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
 *                     content:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
const createComment = async (req, res) => {
  try {
    const { postId, content } = req.body;

    // Validate input
    if (!postId || !mongoose.isValidObjectId(postId)) {
      return errorHandler.handleValidationError('Invalid post ID', res);
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return errorHandler.handleValidationError('Content is required and must be a non-empty string', res);
    }

    // Create and save comment
    const comment = new Comment({
      post: postId,
      author: req.user.userId,
      content: content.trim(),
    });

    await comment.save();

    // Populate author for response
    const populatedComment = await Comment.findById(comment._id).populate('author', 'username email');

    errorHandler.logSuccess('Comment created', { commentId: comment._id, postId });
    res.status(201).json({
      message: 'Comment created successfully',
      comment: populatedComment,
    });
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res);
  }
};

/**
 * @swagger
 * /comments/post/{postId}:
 *   get:
 *     summary: Get all comments for a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       post:
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
 *                       content:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Validation error
 */
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    // Validate postId
    if (!postId || !mongoose.isValidObjectId(postId)) {
      return errorHandler.handleValidationError('Invalid post ID', res);
    }

    // Fetch comments and populate author
    const comments = await Comment.find({ post: postId })
      .populate('author', 'username email')
      .sort({ createdAt: -1 }); // Sort by newest first

    errorHandler.logSuccess('Comments retrieved', { postId, count: comments.length });
    res.json({
      message: 'Comments retrieved successfully',
      comments,
    });
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res);
  }
};

/**
 * @swagger
 * /comments/{commentId}:
 *   get:
 *     summary: Get a single comment
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 comment:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     post:
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
 *                       content:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Validation error
 *       404:
 *         description: Comment not found
 */
const getSingleComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Validate commentId
    if (!commentId || !mongoose.isValidObjectId(commentId)) {
      return errorHandler.handleValidationError('Invalid comment ID', res);
    }

    // Fetch comment and populate author
    const comment = await Comment.findById(commentId).populate('author', 'username email');

    if (!comment) {
      return errorHandler.handleNotFoundError('Comment not found', res);
    }

    errorHandler.logSuccess('Comment retrieved', { commentId });
    res.json({
      message: 'Comment retrieved successfully',
      comment,
    });
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res);
  }
};

/**
 * @swagger
 * /comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
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
 *         description: Comment not found
 */
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    // Validate commentId
    if (!commentId || !mongoose.isValidObjectId(commentId)) {
      return errorHandler.handleValidationError('Invalid comment ID', res);
    }

    // Fetch comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return errorHandler.handleNotFoundError('Comment not found', res);
    }

    // Check if user is the author or an admin
    const user = await User.findById(userId);
    if (!user) {
      return errorHandler.handleNotFoundError('User not found', res);
    }
    if (comment.author.toString() !== userId && user.role !== 'admin') {
      return errorHandler.handleAuthError('Not authorized to delete this comment', res);
    }

    // Delete comment
    await comment.deleteOne();

    errorHandler.logSuccess('Comment deleted', { commentId, userId });
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res);
  }
};

module.exports = { createComment, getComments, getSingleComment, deleteComment };