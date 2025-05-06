const express = require('express');
const dotenv = require('dotenv');
const db = require('./config/db');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
// Routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const cors = require('cors');
const errorHandler = require('./utils/errorHandling');

dotenv.config({path: ".env"});

const app = express();
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  handler: (req, res) => {
    errorHandler.handleRateLimitError('Too many requests from this IP', res);
  },
});

// Apply rate-limiting to all API routes
app.use('/api', limiter);

// Global error-handling middleware
app.use((err, req, res, next) => {
  errorHandler.handleError(err, res);
});

db.connect();

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
