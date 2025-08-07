const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure data directory exists in the lambda environment
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize scenarios file if it doesn't exist
const scenariosFile = path.join(dataDir, 'scenarios.json');
if (!fs.existsSync(scenariosFile)) {
  fs.writeFileSync(scenariosFile, JSON.stringify([], null, 2));
}

// Import routes
const scenariosRouter = require('../../src/routes/scenarios');
const calculationsRouter = require('../../src/routes/calculations');

// API Routes - add /api prefix for the serverless function
app.use('/api/scenarios', scenariosRouter);
app.use('/api/calculations', calculationsRouter);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Personal Finance Simulator API' });
});

// Export the serverless function
module.exports.handler = serverless(app);
