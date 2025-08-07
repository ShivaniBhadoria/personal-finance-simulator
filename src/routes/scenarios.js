/**
 * Scenarios Router
 * Handles all operations related to financial scenarios including CRUD operations
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const scenariosFile = path.join(__dirname, '../../data/scenarios.json');

// Helper function to read scenarios
const getScenarios = () => {
  try {
    const data = fs.readFileSync(scenariosFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading scenarios file:', error);
    return [];
  }
};

// Helper function to write scenarios
const saveScenarios = (scenarios) => {
  try {
    fs.writeFileSync(scenariosFile, JSON.stringify(scenarios, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing scenarios file:', error);
    return false;
  }
};

// Get all scenarios
router.get('/', (req, res) => {
  const scenarios = getScenarios();
  res.json(scenarios);
});

// Get a specific scenario
router.get('/:id', (req, res) => {
  const scenarios = getScenarios();
  const scenario = scenarios.find(s => s.id === req.params.id);
  
  if (!scenario) {
    return res.status(404).json({ message: 'Scenario not found' });
  }
  
  res.json(scenario);
});

// Create a new scenario
router.post('/', (req, res) => {
  const scenarios = getScenarios();
  
  // Generate a unique ID
  const id = Date.now().toString();
  
  const newScenario = {
    id,
    name: req.body.name,
    description: req.body.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    initialAmount: req.body.initialAmount || 0,
    monthlyIncome: req.body.monthlyIncome || 0,
    monthlyExpenses: req.body.monthlyExpenses || 0,
    investments: req.body.investments || [],
    savingsRate: req.body.savingsRate || 0,
    inflationRate: req.body.inflationRate || 2,
    timeframe: req.body.timeframe || 10 // years
  };
  
  scenarios.push(newScenario);
  
  if (saveScenarios(scenarios)) {
    res.status(201).json(newScenario);
  } else {
    res.status(500).json({ message: 'Failed to create scenario' });
  }
});

// Update a scenario
router.put('/:id', (req, res) => {
  const scenarios = getScenarios();
  const index = scenarios.findIndex(s => s.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Scenario not found' });
  }
  
  const updatedScenario = {
    ...scenarios[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
    id: req.params.id // Ensure ID doesn't change
  };
  
  scenarios[index] = updatedScenario;
  
  if (saveScenarios(scenarios)) {
    res.json(updatedScenario);
  } else {
    res.status(500).json({ message: 'Failed to update scenario' });
  }
});

// Delete a scenario
router.delete('/:id', (req, res) => {
  const scenarios = getScenarios();
  const filteredScenarios = scenarios.filter(s => s.id !== req.params.id);
  
  if (filteredScenarios.length === scenarios.length) {
    return res.status(404).json({ message: 'Scenario not found' });
  }
  
  if (saveScenarios(filteredScenarios)) {
    res.json({ message: 'Scenario deleted successfully' });
  } else {
    res.status(500).json({ message: 'Failed to delete scenario' });
  }
});

module.exports = router;
