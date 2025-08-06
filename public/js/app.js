/**
 * Personal Finance Simulator - Main Application
 * Handles all frontend functionality including UI interactions, data management, and visualizations
 */

document.addEventListener('DOMContentLoaded', () => {
    // Set up navigation
    setupNavigation();
    
    // Set up modal handlers
    setupModals();
    
    // Set up form handlers
    setupFormHandlers();
    
    // Initialize charts
    initializeCharts();
    
    // Load scenarios from the server
    loadScenarios();
});

// Global variables
let scenarios = [];
let currentScenarioId = null;
let charts = {};

/**
 * Initialize navigation between different views
 */
function initNavigation() {
    // Show the view based on URL hash or default to dashboard
    const hash = window.location.hash.substring(1) || 'dashboard';
    showView(hash);
}

/**
 * Show a specific view and hide others
 * @param {string} viewId - The ID of the view to show
 */
function showView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show the selected view
    const viewElement = document.getElementById(viewId);
    if (viewElement) {
        viewElement.classList.add('active');
    }
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-view') === viewId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Set up navigation between views
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-view');
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Hide all views and show the target view
            document.querySelectorAll('.view').forEach(view => {
                view.classList.remove('active');
            });
            document.getElementById(targetView).classList.add('active');
            
            // Update current view
            currentView = targetView;
            
            // Special handling for different views
            if (targetView === 'dashboard') {
                updateDashboard();
            } else if (targetView === 'scenarios') {
                renderScenariosGrid();
            } else if (targetView === 'calculator') {
                setupCalculators();
            }
        });
    });
}

// Set up modal handlers
function setupModals() {
    // Close modal when clicking on the close button or outside the modal
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
        element.addEventListener('click', (e) => {
            if (e.target === element) {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });
    });
    
    // Open scenario modal when clicking on the create scenario button
    document.getElementById('create-scenario').addEventListener('click', () => {
        openScenarioModal();
    });
    
    // Add event listener for the alternative create scenario button if it exists
    const createScenarioAlt = document.getElementById('create-scenario-alt');
    if (createScenarioAlt) {
        createScenarioAlt.addEventListener('click', () => {
            openScenarioModal();
        });
    }
    
    // Add investment button handler
    document.getElementById('add-investment').addEventListener('click', () => {
        addInvestmentInput();
    });
    
    // Add cancel button handler for the scenario modal
    const cancelButton = document.getElementById('cancel-scenario');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            // Check if form has been modified
            const form = document.getElementById('scenario-form');
            const hasChanges = form && (
                document.getElementById('scenario-name').value ||
                document.getElementById('scenario-description').value ||
                parseFloat(document.getElementById('scenario-initial').value) > 0 ||
                document.querySelectorAll('.investment-input').length > 1
            );
            
            if (hasChanges) {
                // Show confirmation dialog
                if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                    closeScenarioModal();
                }
            } else {
                // No changes, just close
                closeScenarioModal();
            }
        });
    }
}

// Set up form handlers
function setupFormHandlers() {
    // Scenario form submission
    document.getElementById('scenario-form').addEventListener('submit', handleScenarioSubmit);
    
    // Calculator form submissions
    initializeCalculatorForms();
    
    // Add expense button handler
    document.getElementById('add-expense').addEventListener('click', () => {
        addExpenseInput();
    });
}

/**
 * Initialize calculator forms with event listeners and interactive elements
 */
function initializeCalculatorForms() {
    // Set up form event listeners
    document.getElementById('investment-form').addEventListener('submit', handleInvestmentCalculation);
    document.getElementById('retirement-form').addEventListener('submit', handleRetirementCalculation);
    document.getElementById('debt-form').addEventListener('submit', handleDebtCalculation);
    document.getElementById('budget-form').addEventListener('submit', handleBudgetCalculation);
    
    // Set up retirement age range slider
    const retirementAgeSlider = document.getElementById('retirement-age');
    if (retirementAgeSlider) {
        retirementAgeSlider.addEventListener('input', function() {
            document.getElementById('retirement-age-value').textContent = this.value;
        });
    }
    
    // Add reset button functionality for retirement form
    const retirementForm = document.getElementById('retirement-form');
    if (retirementForm) {
        retirementForm.addEventListener('reset', function() {
            // Hide results when form is reset
            document.getElementById('retirement-result').classList.add('hidden');
            document.getElementById('retirement-chart-container').classList.add('hidden');
            
            // Reset the retirement age slider value display
            setTimeout(() => {
                const retirementAgeSlider = document.getElementById('retirement-age');
                if (retirementAgeSlider) {
                    document.getElementById('retirement-age-value').textContent = retirementAgeSlider.value;
                }
            }, 0);
        });
    }
}

// Initialize charts for the application
function initializeCharts() {
    // Dashboard summary charts
    charts.netWorth = new Chart(
        document.getElementById('net-worth-chart').getContext('2d'),
        createLineChartConfig('Projected Net Worth', [], [], 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)')
    );
    
    charts.monthlyCashFlow = new Chart(
        document.getElementById('cash-flow-chart').getContext('2d'),
        createBarChartConfig('Monthly Cash Flow', [], [], 'rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 1)')
    );
    
    // Calculator charts
    charts.investmentGrowth = new Chart(
        document.getElementById('investment-chart').getContext('2d'),
        createLineChartConfig('Investment Growth', [], [], 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)')
    );
    
    charts.retirementProjection = new Chart(
        document.getElementById('retirement-chart').getContext('2d'),
        createLineChartConfig('Retirement Projection', [], [], 'rgba(153, 102, 255, 0.2)', 'rgba(153, 102, 255, 1)')
    );
    
    charts.debtPayoff = new Chart(
        document.getElementById('debt-chart').getContext('2d'),
        createLineChartConfig('Debt Payoff', [], [], 'rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 1)')
    );
    
    charts.budgetAnalysis = new Chart(
        document.getElementById('budget-chart').getContext('2d'),
        createPieChartConfig('Budget Breakdown', [], [])
    );
}

// Create a line chart configuration
function createLineChartConfig(label, labels, data, backgroundColor, borderColor) {
    return {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            }
        }
    };
}

// Create a bar chart configuration
function createBarChartConfig(label, labels, data, backgroundColor, borderColor) {
    return {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            }
        }
    };
}

// Create a pie chart configuration
function createPieChartConfig(label, labels, data) {
    return {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                    'rgba(199, 199, 199, 0.6)',
                    'rgba(83, 102, 255, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)',
                    'rgba(83, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + formatCurrency(context.parsed);
                        }
                    }
                }
            }
        }
    };
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
}

function showNotification(message, type = 'info') {
    // Implementation for showing notifications
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/**
 * Load scenarios from the server
 */
async function loadScenarios() {
    try {
        const response = await fetch('/api/scenarios');
        scenarios = await response.json();
        updateDashboard();
        renderScenariosGrid();
    } catch (error) {
        console.error('Error loading scenarios:', error);
        showNotification('Failed to load scenarios', 'error');
    }
}

/**
 * Open the scenario modal for creating or editing a scenario
 * @param {Object} [scenario] - Optional scenario data to edit
 */
function openScenarioModal(scenario = null) {
    const modal = document.getElementById('scenario-modal');
    const form = document.getElementById('scenario-form');
    const title = document.getElementById('modal-title');
    
    if (scenario) {
        // Edit existing scenario
        title.textContent = 'Edit Scenario';
        currentScenarioId = scenario.id;
        
        // Fill in the form with scenario data
        document.getElementById('scenario-name').value = scenario.name || '';
        document.getElementById('scenario-description').value = scenario.description || '';
        document.getElementById('scenario-initial').value = scenario.initialAmount || 0;
        document.getElementById('scenario-income').value = scenario.monthlyIncome || 0;
        document.getElementById('scenario-expenses').value = scenario.monthlyExpenses || 0;
        document.getElementById('scenario-savings').value = scenario.savingsRate || 0;
        document.getElementById('scenario-inflation').value = scenario.inflationRate || 2;
        document.getElementById('scenario-timeframe').value = scenario.timeframe || 10;
        
        // Clear existing investments
        const investmentsContainer = document.getElementById('investments-container');
        investmentsContainer.innerHTML = '';
        
        // Add investments if they exist
        if (scenario.investments && scenario.investments.length > 0) {
            scenario.investments.forEach(investment => {
                addInvestmentInput(investment);
            });
        } else {
            // Add one empty investment row by default
            addInvestmentInput();
        }
    } else {
        // Create new scenario
        title.textContent = 'Create New Scenario';
        currentScenarioId = null;
        form.reset();
        
        // Clear investments container and add one empty row
        const investmentsContainer = document.getElementById('investments-container');
        investmentsContainer.innerHTML = '';
        addInvestmentInput();
    }
    
    // Show the modal
    modal.classList.add('active');
}

/**
 * Close the scenario modal
 */
function closeScenarioModal() {
    const modal = document.getElementById('scenario-modal');
    modal.classList.remove('active');
    currentScenarioId = null;
}

/**
 * Add a new investment input row
 * @param {Object} [investment] - Optional investment data to pre-fill
 */
function addInvestmentInput(investment = {}) {
    const container = document.getElementById('investments-container');
    const div = document.createElement('div');
    div.className = 'investment-input';
    div.innerHTML = `
        <div class="form-group">
            <input type="text" class="investment-name" placeholder="Investment name" value="${investment.name || ''}">
        </div>
        <div class="form-group">
            <input type="number" class="investment-amount" placeholder="Amount" min="0" step="100" value="${investment.amount || ''}">
        </div>
        <div class="form-group">
            <input type="number" class="investment-rate" placeholder="Rate %" min="0" max="100" step="0.1" value="${investment.rate || ''}">
        </div>
        <button type="button" class="btn btn-icon remove-investment">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add remove button handler
    const removeBtn = div.querySelector('.remove-investment');
    removeBtn.addEventListener('click', () => {
        div.remove();
    });
    
    container.appendChild(div);
}

/**
 * Handle scenario form submission
 * @param {Event} e - Form submission event
 */
async function handleScenarioSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('scenario-name').value,
        description: document.getElementById('scenario-description').value,
        initialAmount: parseFloat(document.getElementById('scenario-initial').value) || 0,
        monthlyIncome: parseFloat(document.getElementById('scenario-income').value) || 0,
        monthlyExpenses: parseFloat(document.getElementById('scenario-expenses').value) || 0,
        savingsRate: parseFloat(document.getElementById('scenario-savings').value) || 0,
        inflationRate: parseFloat(document.getElementById('scenario-inflation').value) || 2,
        timeframe: parseInt(document.getElementById('scenario-timeframe').value) || 10,
        investments: []
    };
    
    // Get investments
    const investmentInputs = document.querySelectorAll('.investment-input');
    investmentInputs.forEach(input => {
        const name = input.querySelector('.investment-name').value;
        const amount = parseFloat(input.querySelector('.investment-amount').value) || 0;
        const rate = parseFloat(input.querySelector('.investment-rate').value) || 0;
        
        if (name && (amount > 0 || rate > 0)) {
            formData.investments.push({
                name,
                amount,
                rate
            });
        }
    });
    
    try {
        let response;
        const url = currentScenarioId 
            ? `/api/scenarios/${currentScenarioId}` 
            : '/api/scenarios';
            
        if (currentScenarioId) {
            // Update existing scenario
            response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        } else {
            // Create new scenario
            response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        }
        
        if (!response.ok) {
            throw new Error('Failed to save scenario');
        }
        
        // Close modal and refresh scenarios
        closeScenarioModal();
        await loadScenarios();
        showNotification('Scenario saved successfully', 'success');
        
    } catch (error) {
        console.error('Error saving scenario:', error);
        showNotification('Failed to save scenario', 'error');
    }
}

/**
 * Delete a scenario by ID
 * @param {string} id - The ID of the scenario to delete
 */
async function deleteScenario(id) {
    if (!confirm('Are you sure you want to delete this scenario? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/scenarios/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete scenario');
        }
        
        // Remove the scenario from the local array
        scenarios = scenarios.filter(s => s.id !== id);
        
        // Update the UI
        updateDashboard();
        renderScenariosGrid();
        
        showNotification('Scenario deleted successfully', 'success');
        
    } catch (error) {
        console.error('Error deleting scenario:', error);
        showNotification('Failed to delete scenario', 'error');
    }
}

/**
 * Render the scenarios grid on the scenarios page
 */
function renderScenariosGrid() {
    const grid = document.getElementById('scenarios-grid');
    
    if (scenarios.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>No scenarios found. Create your first scenario to get started.</p>
                <button id="create-scenario-empty" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Create Scenario
                </button>
            </div>
        `;
        
        // Add event listener to the create button in the empty state
        const createBtn = document.getElementById('create-scenario-empty');
        if (createBtn) {
            createBtn.addEventListener('click', () => openScenarioModal());
        }
        
        return;
    }
    
    // Sort scenarios by most recently updated
    const sortedScenarios = [...scenarios].sort((a, b) => 
        new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
    
    grid.innerHTML = sortedScenarios.map(scenario => {
        // Calculate some summary stats
        const monthlySavings = scenario.monthlyIncome - scenario.monthlyExpenses;
        const savingsRate = scenario.monthlyIncome > 0 
            ? (monthlySavings / scenario.monthlyIncome * 100).toFixed(1) 
            : 0;
        
        return `
            <div class="card scenario-card">
                <div class="card-header">
                    <h3>${scenario.name}</h3>
                    <div class="scenario-actions">
                        <button class="btn btn-icon" onclick="editScenario('${scenario.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon" onclick="deleteScenario('${scenario.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <p class="scenario-description">${scenario.description || 'No description'}</p>
                    
                    <div class="scenario-stats">
                        <div class="stat-item">
                            <span class="stat-label">Monthly Income</span>
                            <span class="stat-value">${formatCurrency(scenario.monthlyIncome)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Monthly Expenses</span>
                            <span class="stat-value">${formatCurrency(scenario.monthlyExpenses)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Monthly Savings</span>
                            <span class="stat-value ${monthlySavings >= 0 ? 'positive' : 'negative'}">
                                ${formatCurrency(monthlySavings)}
                            </span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Savings Rate</span>
                            <span class="stat-value">${savingsRate}%</span>
                        </div>
                    </div>
                    
                    <div class="scenario-meta">
                        <span>Updated: ${formatDate(scenario.updatedAt || scenario.createdAt)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Make these functions available globally
window.editScenario = (id) => {
    const scenario = scenarios.find(s => s.id === id);
    if (scenario) {
        openScenarioModal(scenario);
    }
};

window.deleteScenario = deleteScenario;

/**
 * Update the dashboard with summary information and charts
 */
function updateDashboard() {
    if (!scenarios || scenarios.length === 0) {
        document.getElementById('active-scenarios').textContent = '0';
        document.getElementById('net-worth-projection').textContent = formatCurrency(0);
        document.getElementById('monthly-savings').textContent = formatCurrency(0);
        document.getElementById('avg-investment-return').textContent = '0%';
        
        // Update charts with empty data
        updateNetWorthChart([]);
        updateCashFlowChart([]);
        return;
    }
    
    // Update active scenarios count
    document.getElementById('active-scenarios').textContent = scenarios.length;
    
    // Calculate total net worth projection (sum of all scenario final balances)
    const totalNetWorth = scenarios.reduce((sum, scenario) => {
        // Simple projection: (initial + (income - expenses) * months) * (1 + avg return rate)
        const months = scenario.timeframe * 12;
        const avgReturnRate = scenario.investments && scenario.investments.length > 0 
            ? scenario.investments.reduce((sum, inv) => sum + (inv.rate || 0), 0) / scenario.investments.length / 100 
            : 0.05; // Default to 5% if no investments
            
        const finalBalance = (scenario.initialAmount + 
            (scenario.monthlyIncome - scenario.monthlyExpenses) * months) * 
            Math.pow(1 + avgReturnRate, scenario.timeframe);
            
        return sum + finalBalance;
    }, 0);
    
    document.getElementById('net-worth-projection').textContent = formatCurrency(totalNetWorth);
    
    // Calculate average monthly savings across scenarios
    const avgMonthlySavings = scenarios.reduce((sum, scenario) => {
        return sum + (scenario.monthlyIncome - scenario.monthlyExpenses);
    }, 0) / scenarios.length;
    
    document.getElementById('monthly-savings').textContent = formatCurrency(avgMonthlySavings);
    
    // Calculate average investment return rate
    let totalInvestments = 0;
    const totalReturnRate = scenarios.reduce((sum, scenario) => {
        if (scenario.investments && scenario.investments.length > 0) {
            totalInvestments += scenario.investments.length;
            return sum + scenario.investments.reduce((s, inv) => s + (inv.rate || 0), 0);
        }
        return sum;
    }, 0);
    
    const avgReturnRate = totalInvestments > 0 ? (totalReturnRate / totalInvestments).toFixed(1) : '0';
    document.getElementById('avg-investment-return').textContent = `${avgReturnRate}%`;
    
    // Update charts
    updateNetWorthChart(scenarios);
    updateCashFlowChart(scenarios);
}

/**
 * Update the net worth chart on the dashboard
 * @param {Array} scenarios - Array of scenario objects
 */
function updateNetWorthChart(scenarios) {
    if (!charts.netWorth) return;
    
    // Generate projection data for each year
    const years = 30; // Project for 30 years
    const labels = Array.from({length: years + 1}, (_, i) => `Year ${i}`);
    
    // Calculate net worth for each year across all scenarios
    const data = Array(years + 1).fill(0);
    
    scenarios.forEach(scenario => {
        const initialAmount = scenario.initialAmount || 0;
        const monthlySavings = (scenario.monthlyIncome || 0) - (scenario.monthlyExpenses || 0);
        const avgReturnRate = scenario.investments && scenario.investments.length > 0 
            ? scenario.investments.reduce((sum, inv) => sum + (inv.rate || 0), 0) / scenario.investments.length / 100 
            : 0.05; // Default to 5% if no investments
        
        // Year 0 is initial amount
        data[0] += initialAmount;
        
        // Calculate for each subsequent year
        for (let year = 1; year <= years; year++) {
            // Previous year's balance plus this year's savings and growth
            const prevYearAmount = data[year - 1];
            const yearSavings = monthlySavings * 12;
            const yearGrowth = prevYearAmount * avgReturnRate;
            
            data[year] += prevYearAmount + yearSavings + yearGrowth;
        }
    });
    
    // Update chart data
    charts.netWorth.data.labels = labels;
    charts.netWorth.data.datasets[0].data = data;
    charts.netWorth.update();
}

/**
 * Update the cash flow chart on the dashboard
 * @param {Array} scenarios - Array of scenario objects
 */
function updateCashFlowChart(scenarios) {
    if (!charts.monthlyCashFlow) return;
    
    // Get income and expenses for each scenario
    const labels = scenarios.map(s => s.name || 'Unnamed Scenario');
    const incomeData = scenarios.map(s => s.monthlyIncome || 0);
    const expenseData = scenarios.map(s => s.monthlyExpenses || 0);
    
    // Update chart with two datasets
    charts.monthlyCashFlow.data.labels = labels;
    charts.monthlyCashFlow.data.datasets = [
        {
            label: 'Monthly Income',
            data: incomeData,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        },
        {
            label: 'Monthly Expenses',
            data: expenseData,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        }
    ];
    
    charts.monthlyCashFlow.update();
}

/**
 * Set up the calculator tabs and initial state
 */
function setupCalculators() {
    // Set up calculator tab navigation
    const calculatorTabs = document.querySelectorAll('.calculator-tab');
    const calculatorPanes = document.querySelectorAll('.calculator-pane');
    
    calculatorTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target');
            
            // Update active tab
            calculatorTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show target pane and hide others
            calculatorPanes.forEach(pane => {
                if (pane.id === target) {
                    pane.classList.add('active');
                } else {
                    pane.classList.remove('active');
                }
            });
        });
    });
    
    // Add initial expense input if none exists
    if (document.querySelectorAll('.expense-input').length === 0) {
        addExpenseInput();
    }
}

/**
 * Handle investment growth calculation form submission
 * @param {Event} e - Form submission event
 */
async function handleInvestmentCalculation(e) {
    e.preventDefault();
    
    const principal = parseFloat(document.getElementById('investment-principal').value) || 0;
    const monthlyContribution = parseFloat(document.getElementById('investment-monthly').value) || 0;
    const annualRate = parseFloat(document.getElementById('investment-rate').value) || 0;
    const years = parseInt(document.getElementById('investment-years').value) || 0;
    
    if (principal <= 0 || years <= 0) {
        showNotification('Please enter valid investment details', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/calculations/investment-growth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                principal,
                monthlyContribution,
                annualRate,
                years
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to calculate investment growth');
        }
        
        const result = await response.json();
        
        // Display results
        document.getElementById('investment-result-final').textContent = formatCurrency(result.finalBalance);
        document.getElementById('investment-result-principal').textContent = formatCurrency(principal);
        document.getElementById('investment-result-contributions').textContent = formatCurrency(result.totalContributions);
        document.getElementById('investment-result-interest').textContent = formatCurrency(result.totalInterest);
        
        // Update chart
        updateInvestmentChart(result.yearlyData);
        
        // Show results section
        document.getElementById('investment-results').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error calculating investment growth:', error);
        showNotification('Failed to calculate investment growth', 'error');
    }
}

/**
 * Update the investment growth chart with calculation results
 * @param {Array} yearlyData - Array of yearly balance data
 */
function updateInvestmentChart(yearlyData) {
    if (!charts.investmentGrowth) return;
    
    const labels = yearlyData.map((_, index) => `Year ${index}`);
    const data = yearlyData.map(year => year.balance);
    
    charts.investmentGrowth.data.labels = labels;
    charts.investmentGrowth.data.datasets[0].data = data;
    charts.investmentGrowth.update();
}

/**
 * Handle retirement projection calculation form submission
 * @param {Event} e - Form submission event
 */
async function handleRetirementCalculation(e) {
    e.preventDefault();
    
    // Get form inputs
    const currentAge = parseInt(document.getElementById('current-age').value) || 0;
    const retirementAge = parseInt(document.getElementById('retirement-age').value) || 0;
    const lifeExpectancy = parseInt(document.getElementById('life-expectancy').value) || 0;
    const currentSavings = parseFloat(document.getElementById('current-savings').value) || 0;
    const monthlySavings = parseFloat(document.getElementById('monthly-savings').value) || 0;
    const monthlyExpenses = parseFloat(document.getElementById('retirement-expenses').value) || 0;
    const annualReturn = parseFloat(document.getElementById('retirement-return').value) || 0;
    const inflationRate = parseFloat(document.getElementById('inflation-rate').value) || 0;
    
    // Validate inputs
    let hasErrors = false;
    
    if (currentAge <= 0 || currentAge >= retirementAge) {
        highlightInvalidField('current-age', 'Current age must be less than retirement age');
        hasErrors = true;
    }
    
    if (retirementAge <= currentAge || retirementAge >= lifeExpectancy) {
        highlightInvalidField('retirement-age', 'Retirement age must be between current age and life expectancy');
        hasErrors = true;
    }
    
    if (lifeExpectancy <= retirementAge) {
        highlightInvalidField('life-expectancy', 'Life expectancy must be greater than retirement age');
        hasErrors = true;
    }
    
    if (annualReturn < 0 || annualReturn > 20) {
        highlightInvalidField('retirement-return', 'Annual return must be between 0% and 20%');
        hasErrors = true;
    }
    
    if (inflationRate < 0 || inflationRate > 10) {
        highlightInvalidField('inflation-rate', 'Inflation rate must be between 0% and 10%');
        hasErrors = true;
    }
    
    if (hasErrors) {
        showNotification('Please correct the errors in the form', 'error');
        return;
    }
    
    // Show loading state
    const calculateBtn = document.querySelector('#retirement-form button[type="submit"]');
    const originalBtnText = calculateBtn.innerHTML;
    calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating...';
    calculateBtn.disabled = true;
    
    try {
        const response = await fetch('/api/calculations/retirement-projection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentAge,
                retirementAge,
                lifeExpectancy,
                currentSavings,
                monthlySavings,
                monthlyExpenses,
                annualReturn,
                inflationRate
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to calculate retirement projection');
        }
        
        const result = await response.json();
        
        // Update dynamic age displays in results
        document.getElementById('retirement-age-display').textContent = retirementAge;
        document.getElementById('life-expectancy-display').textContent = lifeExpectancy;
        
        // Display results
        document.getElementById('retirement-savings').textContent = formatCurrency(result.retirementSavings);
        document.getElementById('retirement-monthly-income').textContent = formatCurrency(result.monthlyIncome);
        document.getElementById('retirement-final-balance').textContent = formatCurrency(result.finalBalance);
        
        // Update status indicator
        const statusIndicator = document.getElementById('retirement-status-indicator');
        const statusMessage = document.getElementById('retirement-status-message');
        
        if (result.isSustainable) {
            statusIndicator.className = 'status-indicator sustainable';
            statusMessage.textContent = 'Your retirement plan is sustainable!';
        } else {
            statusIndicator.className = 'status-indicator unsustainable';
            statusMessage.textContent = `Your savings may run out ${result.yearsOfIncome} years into retirement`;
        }
        
        // Update timeline positions
        updateRetirementTimeline(currentAge, retirementAge, lifeExpectancy);
        
        // Update chart
        updateRetirementChart(result.projectionData);
        
        // Show results with animation
        document.getElementById('retirement-result').classList.remove('hidden');
        document.getElementById('retirement-chart-container').classList.remove('hidden');
        
        // Scroll to results
        document.getElementById('retirement-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        console.error('Error calculating retirement projection:', error);
        showNotification('Failed to calculate retirement projection', 'error');
    } finally {
        // Restore button state
        calculateBtn.innerHTML = originalBtnText;
        calculateBtn.disabled = false;
    }
}

/**
 * Update the retirement projection chart with calculation results
 * @param {Array} projectionData - Array of yearly projection data
 */
function updateRetirementChart(projectionData) {
    if (!charts.retirementProjection) {
        // Initialize chart if it doesn't exist
        const ctx = document.getElementById('retirement-chart').getContext('2d');
        charts.retirementProjection = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Retirement Balance',
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Balance: $' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
    
    const labels = projectionData.map(data => `Age ${data.age}`);
    const data = projectionData.map(data => data.balance);
    
    charts.retirementProjection.data.labels = labels;
    charts.retirementProjection.data.datasets[0].data = data;
    charts.retirementProjection.update();
}

/**
 * Update the retirement timeline visualization
 * @param {number} currentAge - Current age
 * @param {number} retirementAge - Retirement age
 * @param {number} lifeExpectancy - Life expectancy
 */
function updateRetirementTimeline(currentAge, retirementAge, lifeExpectancy) {
    const totalYears = lifeExpectancy - currentAge;
    const yearsToRetirement = retirementAge - currentAge;
    const yearsInRetirement = lifeExpectancy - retirementAge;
    
    // Calculate percentages for timeline markers
    const retirementPercent = (yearsToRetirement / totalYears) * 100;
    
    // Position the timeline markers
    document.getElementById('timeline-current-age').style.left = '0%';
    document.getElementById('timeline-retirement-age').style.left = `${retirementPercent}%`;
    document.getElementById('timeline-life-expectancy').style.left = '100%';
    
    // Add years to labels
    document.getElementById('timeline-current-age').querySelector('.marker-label').textContent = 
        `Current (${currentAge})`;
    document.getElementById('timeline-retirement-age').querySelector('.marker-label').textContent = 
        `Retirement (${retirementAge})`;
    document.getElementById('timeline-life-expectancy').querySelector('.marker-label').textContent = 
        `Life Expectancy (${lifeExpectancy})`;
}

/**
 * Handle debt payoff calculation form submission
 * @param {Event} e - Form submission event
 */
async function handleDebtCalculation(e) {
    e.preventDefault();
    
    const balance = parseFloat(document.getElementById('debt-balance').value) || 0;
    const interestRate = parseFloat(document.getElementById('debt-rate').value) || 0;
    const monthlyPayment = parseFloat(document.getElementById('debt-payment').value) || 0;
    const additionalPayment = parseFloat(document.getElementById('debt-additional').value) || 0;
    
    if (balance <= 0 || monthlyPayment <= 0) {
        showNotification('Please enter valid debt details', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/calculations/debt-payoff', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                balance,
                interestRate,
                monthlyPayment,
                additionalPayment
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to calculate debt payoff');
        }
        
        const result = await response.json();
        
        // Display results
        document.getElementById('debt-result-months').textContent = result.months;
        document.getElementById('debt-result-years').textContent = (result.months / 12).toFixed(1);
        document.getElementById('debt-result-interest').textContent = formatCurrency(result.totalInterest);
        document.getElementById('debt-result-payments').textContent = formatCurrency(result.totalPayments);
        
        // Update chart
        updateDebtChart(result.paymentSchedule);
        
        // Show results section
        document.getElementById('debt-results').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error calculating debt payoff:', error);
        showNotification('Failed to calculate debt payoff', 'error');
    }
}

/**
 * Update the debt payoff chart with calculation results
 * @param {Array} paymentSchedule - Array of monthly payment data
 */
function updateDebtChart(paymentSchedule) {
    if (!charts.debtPayoff) return;
    
    // Group by quarters for better visualization
    const labels = [];
    const data = [];
    
    for (let i = 0; i < paymentSchedule.length; i += 3) {
        const month = i + 1;
        labels.push(`Month ${month}`);
        data.push(paymentSchedule[i].remainingBalance);
    }
    
    charts.debtPayoff.data.labels = labels;
    charts.debtPayoff.data.datasets[0].data = data;
    charts.debtPayoff.update();
}

/**
 * Handle budget analysis calculation form submission
 * @param {Event} e - Form submission event
 */
async function handleBudgetCalculation(e) {
    e.preventDefault();
    
    const income = parseFloat(document.getElementById('budget-income').value) || 0;
    const expenses = [];
    
    // Get all expense inputs
    document.querySelectorAll('.expense-input').forEach(input => {
        const category = input.querySelector('.expense-category').value;
        const amount = parseFloat(input.querySelector('.expense-amount').value) || 0;
        
        if (amount > 0) {
            expenses.push({ category, amount });
        }
    });
    
    if (income <= 0 || expenses.length === 0) {
        showNotification('Please enter valid budget details', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/calculations/budget-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                income,
                expenses
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to analyze budget');
        }
        
        const result = await response.json();
        
        // Display results
        document.getElementById('budget-result-income').textContent = formatCurrency(result.income);
        document.getElementById('budget-result-expenses').textContent = formatCurrency(result.totalExpenses);
        document.getElementById('budget-result-savings').textContent = formatCurrency(result.savings);
        document.getElementById('budget-result-rate').textContent = `${result.savingsRate.toFixed(1)}%`;
        
        // Update chart
        updateBudgetChart(result.expenseBreakdown);
        
        // Show results section
        document.getElementById('budget-results').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error analyzing budget:', error);
        showNotification('Failed to analyze budget', 'error');
    }
}

/**
 * Update the budget analysis chart with calculation results
 * @param {Array} expenseBreakdown - Array of expense category data
 */
function updateBudgetChart(expenseBreakdown) {
    if (!charts.budgetAnalysis) return;
    
    const labels = expenseBreakdown.map(item => item.category);
    const data = expenseBreakdown.map(item => item.amount);
    
    charts.budgetAnalysis.data.labels = labels;
    charts.budgetAnalysis.data.datasets[0].data = data;
    charts.budgetAnalysis.update();
}
