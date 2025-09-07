const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const messageRoutes = require('./routes/messageRoutes');

// Use routes
app.use('/api/messages', messageRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'MERN Message Generator API is running!',
    version: '1.0.0',
    endpoints: [
      'GET /api/messages/categories',
      'GET /api/messages/templates',
      'POST /api/messages/generate',
      'POST /api/messages/edit',
      'GET /api/messages/history'
    ]
  });
});

// MongoDB connection (optional - can work without database)
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected successfully');
    } else {
      console.log('⚠️  MongoDB URI not provided - running in memory mode');
    }
  } catch (error) {
    console.log('⚠️  MongoDB connection failed - running in memory mode');
    console.log('Error:', error.message);
  }
};

// Connect to database
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 API available at: http://localhost:${PORT}`);
  console.log(`🔗 Test the API: http://localhost:${PORT}/api/messages/generate`);
});
