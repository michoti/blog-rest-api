const Category = require('../models/Category');
const errorHandler = require('../utils/errorHandling').withScope('CategoryController');

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 category:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorHandler.handleValidationError('Name is required and must be a non-empty string', res);
    }

    // Create and save category
    const category = new Category({ name: name.trim() });

    try {
      await category.save();
    } catch (error) {
      if (error.code === 11000) {
        return errorHandler.handleValidationError('Category name already exists', res);
      }
      throw error;
    }

    errorHandler.logSuccess('Category created', { categoryId: category._id, name: category.name });
    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res);
  }
};

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 */
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }); // Sort alphabetically

    errorHandler.logSuccess('Categories retrieved', { count: categories.length });
    res.json({
      message: 'Categories retrieved successfully',
      categories,
    });
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res);
  }
};

/**
 * @swagger
 * /categories/{categoryId}:
 *   get:
 *     summary: Get a single category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 category:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Validation error
 *       404:
 *         description: Category not found
 */
const getCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Validate categoryId
    if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
      return errorHandler.handleValidationError('Invalid category ID', res);
    }

    // Fetch category
    const category = await Category.findById(categoryId);
    if (!category) {
      return errorHandler.handleNotFoundError('Category not found', res);
    }

    errorHandler.logSuccess('Category retrieved', { categoryId });
    res.json({
      message: 'Category retrieved successfully',
      category,
    });
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res);
  }
};

/**
 * @swagger
 * /categories/{categoryId}:
 *   put:
 *     summary: Update an existing category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 category:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;

    // Validate categoryId
    if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
      return errorHandler.handleValidationError('Invalid category ID', res);
    }

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorHandler.handleValidationError('Name is required and must be a non-empty string', res);
    }

    // Fetch and update category
    const category = await Category.findById(categoryId);
    if (!category) {
      return errorHandler.handleNotFoundError('Category not found', res);
    }

    category.name = name.trim();

    try {
      await category.save();
    } catch (error) {
      if (error.code === 11000) {
        return errorHandler.handleValidationError('Category name already exists', res);
      }
      throw error;
    }

    errorHandler.logSuccess('Category updated', { categoryId, name: category.name });
    res.json({
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res);
  }
};

/**
 * @swagger
 * /categories/{categoryId}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
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
 *         description: Category not found
 */
const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Validate categoryId
    if (!categoryId || !mongoose.isValidObjectId(categoryId)) {
      return errorHandler.handleValidationError('Invalid category ID', res);
    }

    // Fetch and delete category
    const category = await Category.findById(categoryId);
    if (!category) {
      return errorHandler.handleNotFoundError('Category not found', res);
    }

    await category.deleteOne();

    errorHandler.logSuccess('Category deleted', { categoryId, name: category.name });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res);
  }
};

module.exports = { createCategory, getCategories, getCategory, updateCategory, deleteCategory };