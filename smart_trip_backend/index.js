const app = require('./src/app');
const connectDB = require('./src/config/db');

// Connect to MongoDB
connectDB();

// Export the Express app for Vercel Serverless Functions
module.exports = app;
