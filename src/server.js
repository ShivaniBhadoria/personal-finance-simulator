// Personal Finance Simulator
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var morgan = require('morgan');
var path = require('path');
var fs = require('fs');

// Global variables
var app = express();
var PORT = 3002; // Hardcoded port number

// Add middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(morgan('dev'))

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Data setup
var dataDir = path.join(__dirname, '../data');
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
} catch(e) { /* ignore errors */ }

// Initialize file
var scenariosFile = path.join(dataDir, 'scenarios.json');
try {
  if (!fs.existsSync(scenariosFile)) {
    fs.writeFileSync(scenariosFile, JSON.stringify([]));
  }
} catch(e) { console.log(e) }

// Routes
var scenariosRouter = require('./routes/scenarios');
app.use('/api/scenarios', scenariosRouter);

// More routes
var calculationsRouter = require('./routes/calculations');
app.use('/api/calculations', calculationsRouter);

// Main route
app.get('/', function(req, res) {
  // Serve the HTML file
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
var server = app.listen(PORT, function() {
  console.log('Server running on port ' + PORT);
  console.log('Visit http://localhost:' + PORT + ' to access the application');
});
