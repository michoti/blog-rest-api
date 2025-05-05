const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { addToBlacklist } = require('./authMiddleware');
const errorHandler = require('./errorHandler').withScope('AuthController');

// Create a test account for nodemailer
const createTestAccount = async () => {
  return await nodemailer.createTestAccount();
};

// Configure nodemailer with Ethereal test account
const createTransporter = async () => {
  const account = await createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });
};

/**
 * @swagger
 * /auth/sign-up:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return errorHandler.handleValidationError('All fields are required', res);
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return errorHandler.handleValidationError('User already exists', res);
    }

    const user = await User.create({ username, email, password });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    errorHandler.logSuccess('User registered', { userId: user._id });
    res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res);
  }
};

/**
 * @swagger
 * /auth/sign-in:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorHandler.handleValidationError('Email and password are required', res);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return errorHandler.handleNotFoundError('Invalid credentials', res);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorHandler.handleAuthError('Invalid credentials', res);
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    errorHandler.logSuccess('User logged in', { userId: user._id });
    res.json({ message: 'Login successful', token });
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res);
  }
};

/**
 * @swagger
 * /auth/sign-out:
 *   post:
 *     summary: Sign out a user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully signed out
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
 */
const signoutUser = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return errorHandler.handleValidationError('No token provided', res);
    }

    await addToBlacklist(token);
    errorHandler.logSuccess('User signed out', { userId: req.user.userId });
    res.json({ message: 'Successfully signed out' });
  } catch (error) {
    return errorHandler.handleDatabaseError(error, res, 'Error signing out');
  }
};

/**
 * @swagger
 * /auth/password-reset/request:
 *   post:
 *     summary: Request a password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorHandler.handleValidationError('Email is required', res);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return errorHandler.handleNotFoundError('User not found', res);
    }

    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const mailOptions = {
      from: (await createTestAccount()).user,
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Use this token: ${resetToken}`,
    };

    const transporter = await createTransporter();
    const info = await transporter.sendMail(mailOptions);
    errorHandler.logSuccess('Password reset email sent', { email, messageId: info.messageId });
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    return errorHandler.handleError(error, res, 500, 'Error sending password reset email');
  }
};

/**
 * @swagger
 * /auth/password-reset:
 *   post:
 *     summary: Reset a user's password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or invalid token
 *       404:
 *         description: Invalid or expired token
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return errorHandler.handleValidationError('Token and new password are required', res);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded.userId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return errorHandler.handleNotFoundError('Invalid or expired token', res);
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    errorHandler.logSuccess('Password reset', { userId: user._id });
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    return errorHandler.handleError(error, res, 400, 'Invalid token');
  }
};

module.exports = {
  registerUser,
  loginUser,
  signoutUser,
  requestPasswordReset,
  resetPassword,
};