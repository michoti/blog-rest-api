const consola = require('consola');
const winston = require('winston');

/**
 * ErrorHandler class for managing and logging errors for users and developers
 */
class ErrorHandler {
  /**
   * Create an instance of ErrorHandler
   * @param {Object} options - Configuration options
   * @param {string} [options.scope='Application'] - Scope for consola logs
   * @param {boolean} [options.logToConsole=process.env.NODE_ENV !== 'production'] - Enable console logging in non-production
   */
  constructor(options = {}) {
    this.scope = options.scope || 'Application';
    this.logToConsole = options.logToConsole !== false && process.env.NODE_ENV !== 'production';

    // Initialize Winston logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { scope: this.scope },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    });

    // Add console transport in non-production
    if (this.logToConsole) {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }));
    }

    // Initialize consola for console logging (if enabled)
    this.consola = consola.withScope(this.scope);
  }

  /**
   * Handle a generic error
   * @param {Error|string} error - Error object or message
   * @param {Object} res - Express response object
   * @param {number} [statusCode=500] - HTTP status code
   * @param {string} [userMessage='An unexpected error occurred'] - Message for the user
   * @returns {Object} Express response with error details
   */
  handleError(error, res, statusCode = 500, userMessage = 'An unexpected error occurred') {
    const errorDetails = {
      message: userMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack || new Error(error).stack }),
    };

    this.logger.error({
      message: error.message || error,
      stack: error.stack || new Error(error).stack,
      statusCode,
    });

    return res.status(statusCode).json(errorDetails);
  }

  /**
   * Handle validation errors
   * @param {Error|string} error - Error object or message
   * @param {Object} res - Express response object
   * @param {string} [userMessage='Validation failed'] - Message for the user
   * @returns {Object} Express response with error details
   */
  handleValidationError(error, res, userMessage = 'Validation failed') {
    return this.handleError(error, res, 400, userMessage);
  }

  /**
   * Handle authentication/authorization errors
   * @param {Error|string} error - Error object or message
   * @param {Object} res - Express response object
   * @param {string} [userMessage='Unauthorized access'] - Message for the user
   * @returns {Object} Express response with error details
   */
  handleAuthError(error, res, userMessage = 'Unauthorized access') {
    return this.handleError(error, res, 401, userMessage);
  }

  /**
   * Handle not found errors
   * @param {Error|string} error - Error object or message
   * @param {Object} res - Express response object
   * @param {string} [userMessage='Resource not found'] - Message for the user
   * @returns {Object} Express response with error details
   */
  handleNotFoundError(error, res, userMessage = 'Resource not found') {
    return this.handleError(error, res, 404, userMessage);
  }

  /**
   * Handle database errors
   * @param {Error|string} error - Error object or message
   * @param {Object} res - Express response object
   * @param {string} [userMessage='Database error occurred'] - Message for the user
   * @returns {Object} Express response with error details
   */
  handleDatabaseError(error, res, userMessage = 'Database error occurred') {
    return this.handleError(error, res, 500, userMessage);
  }

  /**
   * Handle rate-limiting errors
   * @param {Error|string} error - Error object or message
   * @param {Object} res - Express response object
   * @param {string} [userMessage='Too many requests'] - Message for the user
   * @returns {Object} Express response with error details
   */
  handleRateLimitError(error, res, userMessage = 'Too many requests') {
    return this.handleError(error, res, 429, userMessage);
  }

  /**
   * Log a success message (for developer use)
   * @param {string} message - Success message
   * @param {Object} [data] - Additional data to log
   */
  logSuccess(message, data = {}) {
    this.logger.info({ message, level: 'success', ...data });
    if (this.logToConsole) {
      this.consola.success({ message, ...data });
    }
  }

  /**
   * Log an info message (for developer use)
   * @param {string} message - Info message
   * @param {Object} [data] - Additional data to log
   */
  logInfo(message, data = {}) {
    this.logger.info({ message, ...data });
    if (this.logToConsole) {
      this.consola.info({ message, ...data });
    }
  }
}

// Create a singleton instance with a default scope
const errorHandler = new ErrorHandler({ scope: 'Application' });

/**
 * Create a scoped error handler for specific modules
 * @param {string} scope - Scope for the logger
 * @returns {ErrorHandler} New ErrorHandler instance with the specified scope
 */
errorHandler.withScope = (scope) => {
  return new ErrorHandler({ scope });
};

module.exports = errorHandler;