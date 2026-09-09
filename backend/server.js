const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./src/config');
const apiRoutes = require('./src/routes/api');

const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'UdyamSarthi National Advisory Platform - Node.js Express Orchestrator',
    port: config.PORT,
    ai_service_url: config.AI_SERVICE_URL
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(config.PORT, () => {
  console.log('=======================================================');
  console.log(`🚀 UdyamSarthi Backend Orchestrator running on port ${config.PORT}`);
  console.log(`🔗 AI Microservice Target: ${config.AI_SERVICE_URL}`);
  console.log('=======================================================');
});
