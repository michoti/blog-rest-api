const express = require('express');
const { 
  createCategory, 
  getCategories, 
  getCategory, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/categoryController');
const { protect, restrictToAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// Category routes
router.post('/', protect, restrictToAdmin, createCategory); // Create a category (admin only)
router.get('/', getCategories); // Get all categories (public)
router.get('/:categoryId', getCategory); // Get a single category (public)
router.put('/:categoryId', protect, restrictToAdmin, updateCategory); // Update a category (admin only)
router.delete('/:categoryId', protect, restrictToAdmin, deleteCategory); // Delete a category (admin only)

module.exports = router;