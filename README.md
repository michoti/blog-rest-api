Blog API
Welcome to my Blog API, a robust Node.js/Express application designed to power a blog platform. I built this API to manage user authentication, blog posts, comments, and categories, with a focus on security, performance, and developer experience. The API includes features like JWT-based authentication, rate-limiting, error handling with Winston logging, and interactive Swagger documentation.
Table of Contents

Features
Technologies
Installation
Environment Variables
Running the App
API Documentation
Usage Examples
Directory Structure
Error Handling
Contributing
License

Features
I designed the Blog API with the following features:

User Authentication:
Register and log in users with JWT tokens (30-day expiration).
Sign out by blacklisting tokens.
Password reset via email (using Ethereal for testing).

Posts:
Create, read, update, and delete posts.
Support for pagination, search, and filtering by category or tags.
Only the author or an admin can update/delete posts.

Comments:
Create, read, and delete comments on posts.
Only the author or an admin can delete comments.

Categories:
Create, read, update, and delete categories (admin-only for create/update/delete).
Unique category names enforced.

Security:
JWT-based authentication with token blacklisting.
Rate-limiting (100 requests per 15 minutes per IP).
Admin-only access for category management.

Documentation:
Interactive Swagger UI at /api-docs for exploring and testing endpoints.

Error Handling:
Centralized error handling with Winston logging to files (logs/error.log, logs/combined.log) and console (in development).
Consistent error responses (e.g., { message: "Invalid post ID" }).

Technologies
I used the following technologies to build the API:

Node.js & Express: Backend framework.
MongoDB & Mongoose: Database and ODM.
jsonwebtoken: JWT authentication.
bcryptjs: Password hashing.
nodemailer: Email sending (Ethereal for testing).
express-rate-limit: Rate-limiting middleware.
winston & consola: Logging.
swagger-jsdoc & swagger-ui-express: API documentation.
dotenv: Environment variable management.

Installation
To set up the app locally, follow these steps:

Clone the Repository:
git clone https://github.com/your-username/blog-api.git
cd blog-api

Install Dependencies:
npm install

This installs all required packages, including express, mongoose, jsonwebtoken, bcryptjs, nodemailer, consola, winston, express-rate-limit, swagger-jsdoc, and swagger-ui-express.

Set Up MongoDB:

Install MongoDB locally or use a cloud provider like MongoDB Atlas.
Ensure MongoDB is running and accessible.

Create Log Directory:
mkdir logs

This is required for Winston logging.

Environment Variables
I use a .env file to manage configuration. Create a .env file in the root directory with the following:
MONGO_URI=mongodb://localhost:27017/blog-api
JWT_SECRET=your-secure-jwt-secret
PORT=3000
NODE_ENV=development

MONGO_URI: Your MongoDB connection string.
JWT_SECRET: A secure string for signing JWTs.
PORT: The port for the server (default: 3000).
NODE_ENV: Set to development for console logging or production to disable it.

Running the App
To start the server, run:
npm start

The server will start on http://localhost:3000, and you'll see:
Server running on port 3000
API documentation available at http://localhost:3000/api-docs

API Documentation
I’ve included Swagger documentation to make exploring the API easy. Access it at:
http://localhost:3000/api-docs

The Swagger UI lists all endpoints, grouped by:

Auth: Register, login, logout, password reset.
Posts: Create, read, update, delete posts.
Comments: Create, read, delete comments.
Categories: Create, read, update, delete categories (admin-only for create/update/delete).

You can test endpoints directly in the UI by entering a JWT token (obtained from /api/auth/sign-in) in the “Authorize” button.
Usage Examples
Here are some example curl commands to demonstrate the API’s functionality. I assume the server is running on http://localhost:3000.

1. Register a User
   curl -X POST http://localhost:3000/api/auth/sign-up \
    -H "Content-Type: application/json" \
    -d '{"username":"john_doe","email":"john@example.com","password":"Password123"}'

Response:
{
"message": "User registered successfully",
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

2. Log In
   curl -X POST http://localhost:3000/api/auth/sign-in \
    -H "Content-Type: application/json" \
    -d '{"email":"john@example.com","password":"Password123"}'

Response:
{
"message": "Login successful",
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Save the token for authenticated requests. 3. Create a Category (Admin Only)
First, create an admin user by updating the user in MongoDB:
use blog-api
db.users.updateOne({ email: "john@example.com" }, { $set: { role: "admin" } })

Then, create a category:
curl -X POST http://localhost:3000/api/categories \
 -H "Content-Type: application/json" \
 -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
 -d '{"name":"Technology"}'

Response:
{
"message": "Category created successfully",
"category": {
"\_id": "671234567890123456789012",
"name": "Technology"
}
}

4. Create a Post
   curl -X POST http://localhost:3000/api/posts \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
    -d '{
   "title":"My First Post",
   "content":"This is my first blog post!",
   "category":"671234567890123456789012",
   "tags":["tech","blog"]
   }'

Response:
{
"message": "Post created successfully",
"post": {
"\_id": "671234567890123456789013",
"title": "My First Post",
"content": "This is my first blog post!",
"author": {
"\_id": "671234567890123456789011",
"username": "john_doe",
"email": "john@example.com"
},
"category": {
"\_id": "671234567890123456789012",
"name": "Technology"
},
"tags": ["tech", "blog"],
"createdAt": "2025-05-05T12:00:00.000Z"
}
}

5. Get All Posts with Pagination
   curl -X GET "http://localhost:3000/api/posts?page=1&limit=10&search=blog&category=671234567890123456789012"

Response:
{
"message": "Posts retrieved successfully",
"posts": [
{
"\_id": "671234567890123456789013",
"title": "My First Post",
"content": "This is my first blog post!",
"author": {
"\_id": "671234567890123456789011",
"username": "john_doe",
"email": "john@example.com"
},
"category": {
"\_id": "671234567890123456789012",
"name": "Technology"
},
"tags": ["tech", "blog"],
"createdAt": "2025-05-05T12:00:00.000Z"
}
],
"totalPosts": 1,
"totalPages": 1,
"currentPage": 1,
"postsPerPage": 10
}

6. Create a Comment
   curl -X POST http://localhost:3000/api/comments \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
    -d '{
   "postId":"671234567890123456789013",
   "content":"Great post!"
   }'

Response:
{
"message": "Comment created successfully",
"comment": {
"\_id": "671234567890123456789014",
"post": "671234567890123456789013",
"author": {
"\_id": "671234567890123456789011",
"username": "john_doe",
"email": "john@example.com"
},
"content": "Great post!",
"createdAt": "2025-05-05T12:01:00.000Z"
}
}

7. Delete a Comment
   curl -X DELETE http://localhost:3000/api/comments/671234567890123456789014 \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

Response:
{
"message": "Comment deleted successfully"
}

8. Request Password Reset
   curl -X POST http://localhost:3000/api/auth/password-reset/request \
    -H "Content-Type: application/json" \
    -d '{"email":"john@example.com"}'

Response:
{
"message": "Password reset email sent"
}

Check the Ethereal email URL (logged to console) for the reset token.
Directory Structure
Here’s how I organized the app:
├── controllers/
│ ├── authController.js # Authentication endpoints
│ ├── commentController.js # Comment endpoints
│ ├── postController.js # Post endpoints
│ ├── categoryController.js # Category endpoints
├── middleware/
│ ├── authMiddleware.js # JWT authentication and admin checks
├── models/
│ ├── BlacklistedToken.js # Blacklisted JWT tokens
│ ├── Comment.js # Comment schema
│ ├── Post.js # Post schema
│ ├── User.js # User schema
│ ├── Category.js # Category schema
├── routes/
│ ├── authRoutes.js # Auth routes
│ ├── commentRoutes.js # Comment routes
│ ├── postRoutes.js # Post routes
│ ├── categoryRoutes.js # Category routes
├── logs/
│ ├── error.log # Error logs
│ ├── combined.log # Combined logs
├── errorHandler.js # Centralized error handling
├── swagger.js # Swagger configuration
├── app.js # Express server
├── .env # Environment variables
├── package.json
└── README.md

Error Handling
I implemented a centralized ErrorHandler class to manage errors consistently:

Validation Errors (400): Invalid input (e.g., missing fields, invalid IDs).
Authentication Errors (401): Invalid or missing JWT, unauthorized actions.
Not Found Errors (404): Missing resources (e.g., post, comment, category).
Rate-Limit Errors (429): Exceeding 100 requests per 15 minutes.
Database Errors (500): MongoDB issues.

Errors are logged to logs/error.log and logs/combined.log using Winston, with console output in development mode. Responses follow the format:
{
"message": "Invalid post ID"
}

Contributing
I welcome contributions! To contribute:

Fork the repository.
Create a feature branch (git checkout -b feature/your-feature).
Commit changes (git commit -m "Add your feature").
Push to the branch (git push origin feature/your-feature).
Open a pull request.

Please include tests and update the Swagger documentation for new endpoints.
License
This project is licensed under the MIT License. See the LICENSE file for details.

I hope you find this Blog API useful! If you have questions or need help, feel free to open an issue or reach out. Happy coding!
