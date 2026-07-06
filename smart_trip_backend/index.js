const app = require('./src/app');
const connectDB = require('./src/config/db');

// Connect to MongoDB
connectDB();

// If the script is run directly (like on Render or local node execution), start the server
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express app for Vercel Serverless Functions
module.exports = app;
