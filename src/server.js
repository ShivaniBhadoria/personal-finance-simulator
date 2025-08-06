// Personal Finance Simulator - A tool to simulate financial scenarios and make informed decisions
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize scenarios file if it doesn't exist
const scenariosFile = path.join(dataDir, 'scenarios.json');
if (!fs.existsSync(scenariosFile)) {
  fs.writeFileSync(scenariosFile, JSON.stringify([], null, 2));
}

// API Routes
const scenariosRouter = require('./routes/scenarios');
app.use('/api/scenarios', scenariosRouter);

// Calculation Routes
const calculationsRouter = require('./routes/calculations');
app.use('/api/calculations', calculationsRouter);

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
});
