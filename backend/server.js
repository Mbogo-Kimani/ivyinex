require('dotenv').config();
require('express-async-errors'); // catches async errors
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const connectDB = require('./config/db');
const routes = require('./routes');
const { startCleanupJob } = require('./jobs/cleanup');

const app = express();

// Configure CORS with specific origins
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://ivynex.vercel.app',
      'https://ivynex.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://localhost:3002' // Add HTTPS localhost for development
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
};

app.use(cors(corsOptions));
app.use(express.json());

// Add keep-alive headers to prevent connection timeouts
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');
  next();
});

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// routes
app.use('/api', routes);

// basic health
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.1',
    mikrotikEndpoint: '/api/mikrotik/login'
  });
});

// Enhanced health check for monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

// Start server and connect to database
async function startServer() {
  try {
    // Connect to database first
    await connectDB();

    // Start the server
    app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`);

      // Start cleanup job only after database is connected
      setTimeout(() => {
        if (mongoose.connection.readyState === 1) {
          startCleanupJob();
        } else {
          logger.warn('Database not ready, skipping cleanup job startup');
        }
      }, 2000); // Wait 2 seconds for connection to stabilize
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

startServer();
