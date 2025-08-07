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

// Define chart colors for consistent styling
const chartColors = [
    'rgba(54, 162, 235, 0.7)',   // Blue
    'rgba(255, 159, 64, 0.7)',   // Orange
    'rgba(75, 192, 192, 0.7)',   // Green
    'rgba(255, 99, 132, 0.7)',   // Red
    'rgba(153, 102, 255, 0.7)',  // Purple
    'rgba(255, 205, 86, 0.7)',   // Yellow
    'rgba(201, 203, 207, 0.7)',  // Grey
    'rgba(255, 99, 71, 0.7)',    // Tomato
    'rgba(50, 205, 50, 0.7)',    // Lime Green
    'rgba(138, 43, 226, 0.7)'    // Blue Violet
];

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
    // Set up scenario form submission
    document.getElementById('scenario-form').addEventListener('submit', handleScenarioSubmit);
    
    // Calculator form submissions
    initializeCalculatorForms();
    
    // Set up other calculator form submissions
    const retirementForm = document.getElementById('retirement-form');
    if (retirementForm) {
        retirementForm.addEventListener('submit', handleRetirementCalculation);
    }
    
    const debtForm = document.getElementById('debt-form');
    if (debtForm) {
        debtForm.addEventListener('submit', handleDebtCalculation);
    }
    
    const budgetForm = document.getElementById('budget-form');
    if (budgetForm) {
        budgetForm.addEventListener('submit', handleBudgetCalculation);
    }
    
    // Set up search functionality
    const scenarioSearch = document.getElementById('scenario-search');
    if (scenarioSearch) {
        scenarioSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterScenarios(searchTerm);
        });
    }
}

/**
 * Initialize calculator forms with event listeners and interactive elements
 */
function initializeCalculatorForms() {
    // Set up form event listeners
    document.getElementById('compound-interest-form')?.addEventListener('submit', handleCompoundInterestCalculation);
    document.getElementById('retirement-form')?.addEventListener('submit', handleRetirementCalculation);
    document.getElementById('debt-payoff-form')?.addEventListener('submit', handleDebtPayoffCalculation);
    document.getElementById('budget-form')?.addEventListener('submit', handleBudgetCalculation);

    // Event listeners for budget form tabs
    const tabButtons = document.querySelectorAll('.tab-btn[data-tab]');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show selected tab content
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Event listeners for budget result tabs
    const resultTabButtons = document.querySelectorAll('.tab-btn[data-result-tab]');
    resultTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-result-tab');
            
            // Update active tab button
            resultTabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show selected tab content
            const tabContents = document.querySelectorAll('.result-tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // Event listeners for adding/removing expense items
    document.getElementById('add-expense')?.addEventListener('click', () => addExpenseInput('expense-inputs'));
    document.getElementById('add-fixed-expense')?.addEventListener('click', () => addExpenseInput('fixed-expense-inputs', 'fixed-expense'));
    document.getElementById('add-variable-expense')?.addEventListener('click', () => addExpenseInput('variable-expense-inputs', 'variable-expense'));
    document.getElementById('add-financial-goal')?.addEventListener('click', addFinancialGoalInput);

    // Delegate event listeners for removing expense items
    document.addEventListener('click', (e) => {
        if (e.target.closest('.remove-expense')) {
            e.target.closest('.expense-input').remove();
        }
        if (e.target.closest('.remove-goal')) {
            e.target.closest('.financial-goal-input').remove();
        }
    });
    
    // Helper functions for budget analysis form
    /**
     * Add a new expense input to the specified container
     * @param {string} containerId - ID of the container to add the expense input to
     * @param {string} [className] - Optional additional class name for the expense input
     */
    function addExpenseInput(containerId, className = '') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const expenseInput = document.createElement('div');
        expenseInput.className = `expense-input ${className}`.trim();
        
        // Determine which category options to show based on the container
        let categoryOptions = '';
        if (containerId === 'fixed-expense-inputs') {
            categoryOptions = `
                <option value="Housing">Housing</option>
                <option value="Utilities">Utilities</option>
                <option value="Insurance">Insurance</option>
                <option value="Debt Payments">Debt Payments</option>
                <option value="Other">Other</option>
            `;
        } else if (containerId === 'variable-expense-inputs') {
            categoryOptions = `
                <option value="Food">Food</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Shopping">Shopping</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Other">Other</option>
            `;
        } else {
            categoryOptions = `
                <option value="Housing">Housing</option>
                <option value="Transportation">Transportation</option>
                <option value="Food">Food</option>
                <option value="Utilities">Utilities</option>
                <option value="Insurance">Insurance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Debt Payments">Debt Payments</option>
                <option value="Subscriptions">Subscriptions</option>
                <option value="Education">Education</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Other">Other</option>
            `;
        }
        
        expenseInput.innerHTML = `
            <div class="form-group">
                <label>Expense Category</label>
                <select class="expense-category">
                    ${categoryOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Amount ($)</label>
                <input type="number" class="expense-amount" min="0" step="10" value="0">
            </div>
            <button type="button" class="btn btn-icon remove-expense"><i class="fas fa-times"></i></button>
        `;
        
        container.appendChild(expenseInput);
    }

    /**
     * Add a new financial goal input to the form
     */
    function addFinancialGoalInput() {
        const container = document.getElementById('financial-goal-inputs');
        if (!container) return;
        
        const goalInput = document.createElement('div');
        goalInput.className = 'financial-goal-input';
        
        goalInput.innerHTML = `
            <div class="form-group">
                <label>Goal Name</label>
                <input type="text" class="goal-name" value="">
            </div>
            <div class="form-group">
                <label>Target Amount ($)</label>
                <input type="number" class="goal-target" min="0" step="100" value="0">
            </div>
            <div class="form-group">
                <label>Current Amount ($)</label>
                <input type="number" class="goal-current" min="0" step="100" value="0">
            </div>
            <div class="form-group">
                <label>Allocation (%)</label>
                <input type="number" class="goal-allocation" min="0" max="100" step="1" value="50">
            </div>
            <button type="button" class="btn btn-icon remove-goal"><i class="fas fa-times"></i></button>
        `;
        
        container.appendChild(goalInput);
    }
    
    // Set up retirement age range slider
    const retirementAgeSlider = document.getElementById('retirement-age');
    const retirementAgeValue = document.getElementById('retirement-age-value');
    if (retirementAgeSlider && retirementAgeValue) {
        retirementAgeSlider.addEventListener('input', function() {
            retirementAgeValue.textContent = this.value;
        });
    }
    
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

/**
 * Validate the scenario form
 * @returns {Array} Array of validation errors
 */
function validateScenarioForm() {
    const errors = [];
    
    // Validate scenario name (required)
    const scenarioName = document.getElementById('scenario-name').value.trim();
    if (!scenarioName) {
        errors.push({
            field: 'scenario-name',
            message: 'Scenario name is required'
        });
    }
    
    // Validate numeric fields
    const numericFields = [
        { id: 'scenario-initial', name: 'Initial Amount', min: 0 },
        { id: 'scenario-income', name: 'Monthly Income', min: 0 },
        { id: 'scenario-expenses', name: 'Monthly Expenses', min: 0 },
        { id: 'scenario-savings', name: 'Savings Rate', min: 0, max: 100 },
        { id: 'scenario-inflation', name: 'Inflation Rate', min: 0, max: 20 },
        { id: 'scenario-timeframe', name: 'Timeframe', min: 1, max: 50 }
    ];
    
    numericFields.forEach(field => {
        const element = document.getElementById(field.id);
        const value = element.value.trim();
        
        if (value === '') {
            errors.push({
                field: field.id,
                message: `${field.name} is required`
            });
        } else {
            const numValue = parseFloat(value);
            
            if (isNaN(numValue)) {
                errors.push({
                    field: field.id,
                    message: `${field.name} must be a valid number`
                });
            } else if (field.min !== undefined && numValue < field.min) {
                errors.push({
                    field: field.id,
                    message: `${field.name} must be at least ${field.min}`
                });
            } else if (field.max !== undefined && numValue > field.max) {
                errors.push({
                    field: field.id,
                    message: `${field.name} cannot exceed ${field.max}`
                });
            }
        }
    });
    
    // Validate investments
    const investmentInputs = document.querySelectorAll('.investment-input');
    if (investmentInputs.length > 0) {
        let hasValidInvestment = false;
        
        investmentInputs.forEach((input, index) => {
            const nameInput = input.querySelector('.investment-name');
            const amountInput = input.querySelector('.investment-amount');
            const rateInput = input.querySelector('.investment-rate');
            
            const name = nameInput.value.trim();
            const amount = parseFloat(amountInput.value) || 0;
            const rate = parseFloat(rateInput.value) || 0;
            
            if (name || amount > 0 || rate > 0) {
                // If any field is filled, all required fields must be valid
                if (!name) {
                    errors.push({
                        field: `investment-${index}`,
                        element: nameInput,
                        message: 'Investment name is required'
                    });
                }
                
                if (amount <= 0 && rate <= 0) {
                    errors.push({
                        field: `investment-${index}`,
                        element: amountInput,
                        message: 'Either amount or rate must be greater than 0'
                    });
                }
                
                if (rate < 0 || rate > 100) {
                    errors.push({
                        field: `investment-${index}`,
                        element: rateInput,
                        message: 'Rate must be between 0 and 100%'
                    });
                }
            }
            
            if (name && (amount > 0 || rate > 0)) {
                hasValidInvestment = true;
            }
        });
    }
    
    return errors;
}

/**
 * Show validation error for a field
 * @param {string} fieldId - ID of the field with error
 * @param {string} message - Error message
 */
function showValidationError(fieldId, message) {
    const field = document.getElementById(fieldId) || fieldId.element;
    if (!field) return;
    
    // Add error class to form group
    const formGroup = field.closest('.form-group');
    if (formGroup) {
        formGroup.classList.add('has-error');
        
        // Create error message element if it doesn't exist
        let errorElement = formGroup.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }
}

/**
 * Clear all validation errors
 */
function clearValidationErrors() {
    // Remove error classes
    document.querySelectorAll('.form-group.has-error').forEach(group => {
        group.classList.remove('has-error');
    });
    
    // Remove error messages
    document.querySelectorAll('.error-message').forEach(element => {
        element.remove();
    });
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
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Highlight invalid form field
function highlightInvalidField(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Add error class to parent form-group
    const formGroup = field.closest('.form-group');
    if (formGroup) {
        formGroup.classList.add('has-error');
        
        // Add error message if it doesn't exist
        if (!formGroup.querySelector('.error-message')) {
            const errorMessage = document.createElement('span');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Please enter a valid value';
            formGroup.appendChild(errorMessage);
        }
        
        // Focus on the field
        field.focus();
        
        // Remove error class when user corrects the input
        field.addEventListener('input', function onInput() {
            formGroup.classList.remove('has-error');
            const errorMessage = formGroup.querySelector('.error-message');
            if (errorMessage) {
                formGroup.removeChild(errorMessage);
            }
            field.removeEventListener('input', onInput);
        });
    }
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
    
    // Clear previous error messages
    clearValidationErrors();
    
    // Validate form
    const validationErrors = validateScenarioForm();
    if (validationErrors.length > 0) {
        // Display validation errors
        validationErrors.forEach(error => {
            showValidationError(error.field, error.message);
        });
        return;
    }
    
    // Get form data
    const formData = {
        name: document.getElementById('scenario-name').value.trim(),
        description: document.getElementById('scenario-description').value.trim(),
        initialAmount: parseFloat(document.getElementById('scenario-initial').value) || 0,
        monthlyIncome: parseFloat(document.getElementById('scenario-income').value) || 0,
        monthlyExpenses: parseFloat(document.getElementById('scenario-expenses').value) || 0,
        savingsRate: parseFloat(document.getElementById('scenario-savings').value) || 0,
        inflationRate: parseFloat(document.getElementById('scenario-inflation').value) || 2,
        timeframe: parseInt(document.getElementById('scenario-timeframe').value) || 10,
        investments: []
    };
/**
 * Handle scenario form submission
 * @param {Event} e - Form submission event
 */
async function handleScenarioSubmit(e) {
    e.preventDefault();
    
    // Clear previous validation errors
    clearValidationErrors();
    
    // Validate form
    const errors = validateScenarioForm();
    
    // Display errors if any and stop submission
    if (errors.length > 0) {
        errors.forEach(error => {
            showValidationError(error.field, error.message);
        });
        
        // Show summary notification for accessibility
        showNotification(`Please fix ${errors.length} error${errors.length > 1 ? 's' : ''} in the form`, 'error');
        return;
    }
    
    // Proceed with form submission if valid
    try {
        // Show loading state
        const submitButton = document.querySelector('#scenario-form button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        
        // Collect form data
        const scenarioData = collectScenarioFormData();
        
        // Submit data
        const response = await submitScenarioData(scenarioData);
        
        // Handle success
        handleSuccessfulSubmission();
        
    } catch (error) {
        // Handle error
        console.error('Error saving scenario:', error);
        showNotification(error.message || 'Failed to save scenario', 'error');
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

/**
 * Collect all data from the scenario form
 * @returns {Object} The collected form data
 */
function collectScenarioFormData() {
    // Get basic scenario data
    const scenarioData = {
        name: document.getElementById('scenario-name').value.trim(),
        initialAmount: parseFloat(document.getElementById('scenario-initial').value) || 0,
        monthlyIncome: parseFloat(document.getElementById('scenario-income').value) || 0,
        monthlyExpenses: parseFloat(document.getElementById('scenario-expenses').value) || 0,
        investments: [],
        goals: []
    };
    
    // Collect investments
    collectInvestments(scenarioData);
    
    // Collect goals
    collectGoals(scenarioData);
    
    return scenarioData;
}
    // Get investments
    const investmentInputs = document.querySelectorAll('.investment-input');
    let hasValidInvestments = false;
    
    investmentInputs.forEach(input => {
        const name = input.querySelector('.investment-name').value.trim();
        const amount = parseFloat(input.querySelector('.investment-amount').value) || 0;
        const rate = parseFloat(input.querySelector('.investment-rate').value) || 0;
        
        if (name && (amount > 0 || rate > 0)) {
            formData.investments.push({
                name,
                amount,
                rate
            });
            hasValidInvestments = true;
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to save scenario');
        }
        
        // Close modal and refresh scenarios
        closeScenarioModal();
        await loadScenarios();
        showNotification('Scenario saved successfully', 'success');
        
    } catch (error) {
        console.error('Error saving scenario:', error);
        showNotification(error.message || 'Failed to save scenario', 'error');
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
            // Calculate growth only on the previous year's amount
            const yearGrowth = prevYearAmount * avgReturnRate;
            
            // Add previous amount, savings for this year, and growth on previous amount
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
    
    // Enhanced validation with detailed error messages
    if (principal < 0) {
        showNotification('Initial investment cannot be negative', 'error');
        highlightInvalidField('investment-principal');
        return;
    }
    if (monthlyContribution < 0) {
        showNotification('Monthly contribution cannot be negative', 'error');
        highlightInvalidField('investment-monthly');
        return;
    }
    if (annualRate < 0 || annualRate > 100) {
        showNotification('Annual return rate must be between 0 and 100', 'error');
        highlightInvalidField('investment-rate');
        return;
    }
    if (years <= 0) {
        showNotification('Investment period must be greater than 0', 'error');
        highlightInvalidField('investment-years');
        return;
    }
    
    // Show loading state
    const calculateButton = document.querySelector('#investment-form button[type="submit"]');
    const originalButtonText = calculateButton.innerHTML;
    calculateButton.disabled = true;
    calculateButton.innerHTML = '<i class="fas fa-spinner"></i> Calculating...';
    
    try {
        const response = await fetch('/api/calculations/investment-growth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                initialAmount: principal, 
                monthlyContribution: monthlyContribution, 
                annualReturnRate: annualRate, 
                years: years 
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to calculate investment growth');
        }
        
        const result = await response.json();
        
        // Update result display with animation
        const resultElement = document.getElementById('investment-result');
        const chartContainer = document.getElementById('investment-chart-container');
        
        // Calculate total contributions
        const totalContributions = principal + (monthlyContribution * years * 12);
        
        // Calculate ROI
        const roi = ((result.finalBalance - totalContributions) / totalContributions) * 100;
        
        // Update result values with animation
        document.getElementById('investment-result-final').textContent = formatCurrency(result.finalBalance);
        document.getElementById('investment-result-contributions').textContent = formatCurrency(totalContributions);
        document.getElementById('investment-result-interest').textContent = formatCurrency(result.totalInterest);
        document.getElementById('investment-result-roi').textContent = roi.toFixed(2) + '%';
        
        // Update percentage bars
        const contributionsPercentage = (totalContributions / result.finalBalance) * 100;
        const interestPercentage = (result.totalInterest / result.finalBalance) * 100;
        
        document.getElementById('contributions-percentage').textContent = contributionsPercentage.toFixed(1) + '%';
        document.getElementById('interest-percentage').textContent = interestPercentage.toFixed(1) + '%';
        
        // Animate the percentage bars
        setTimeout(() => {
            document.getElementById('contributions-percentage-bar').style.width = contributionsPercentage + '%';
            document.getElementById('interest-percentage-bar').style.width = interestPercentage + '%';
        }, 100);
        
        // Show results with fade-in effect
        resultElement.classList.remove('hidden');
        chartContainer.classList.remove('hidden');
        setTimeout(() => {
            resultElement.classList.add('fade-in');
        }, 50);
        
        // Update chart
        updateInvestmentChart(result.monthlyData);
        
        // Highlight the final balance
        const finalBalanceItem = document.querySelector('#investment-result .result-item:first-of-type');
        finalBalanceItem.classList.add('highlight-result');
        
        showNotification('Investment growth calculation complete!', 'success');
    } catch (error) {
        showNotification('Failed to calculate investment growth: ' + error.message, 'error');
    } finally {
        // Restore button state
        calculateButton.disabled = false;
        calculateButton.innerHTML = originalButtonText;
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
        // Initialize charts object to store chart instances
        const charts = {};

        // Define chart colors for consistent styling
        const chartColors = [
            'rgba(54, 162, 235, 0.7)',   // Blue
            'rgba(255, 159, 64, 0.7)',   // Orange
            'rgba(75, 192, 192, 0.7)',   // Green
            'rgba(255, 99, 132, 0.7)',   // Red
            'rgba(153, 102, 255, 0.7)',  // Purple
            'rgba(255, 205, 86, 0.7)',   // Yellow
            'rgba(201, 203, 207, 0.7)',  // Grey
            'rgba(255, 99, 71, 0.7)',    // Tomato
            'rgba(50, 205, 50, 0.7)',    // Lime Green
            'rgba(138, 43, 226, 0.7)'    // Blue Violet
        ];

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
    
    const debtAmount = parseFloat(document.getElementById('debt-amount').value) || 0;
    const interestRate = parseFloat(document.getElementById('debt-interest').value) || 0;
    const monthlyPayment = parseFloat(document.getElementById('debt-payment').value) || 0;
    
    if (debtAmount <= 0 || monthlyPayment <= 0) {
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
                debtAmount,
                interestRate,
                monthlyPayment
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            showNotification(errorData.message || 'Failed to calculate debt payoff', 'error');
            return;
        }
        
        const result = await response.json();
        
        // Display results
        document.getElementById('debt-time').textContent = `${result.monthsToPayoff} months (${result.yearsToPayoff} years)`;
        document.getElementById('debt-interest-paid').textContent = formatCurrency(result.totalInterestPaid);
        document.getElementById('debt-total-paid').textContent = formatCurrency(result.totalPaid);
        
        // Update status indicator
        const statusIndicator = document.getElementById('debt-status-indicator');
        const statusMessage = document.getElementById('debt-status-message');
        
        // Set status based on payoff time
        if (result.yearsToPayoff <= 3) {
            statusIndicator.className = 'status-indicator success';
            statusMessage.textContent = 'Great! You will be debt-free in a short time.';
        } else if (result.yearsToPayoff <= 7) {
            statusIndicator.className = 'status-indicator warning';
            statusMessage.textContent = 'You are on track to eliminate your debt in a reasonable timeframe.';
        } else {
            statusIndicator.className = 'status-indicator danger';
            statusMessage.textContent = 'Consider increasing your monthly payment to pay off debt faster.';
        }
        
        // Display payment strategies if available
        if (result.strategies && result.strategies.length > 0) {
            // Create strategies section if it doesn't exist
            let strategiesSection = document.getElementById('debt-strategies');
            if (!strategiesSection) {
                strategiesSection = document.createElement('div');
                strategiesSection.id = 'debt-strategies';
                strategiesSection.className = 'strategies-section';
                document.getElementById('debt-result').appendChild(strategiesSection);
            } else {
                strategiesSection.innerHTML = '';
            }
            
            // Add header
            const header = document.createElement('h5');
            header.textContent = 'Payment Strategies';
            strategiesSection.appendChild(header);
            
            // Add strategies
            result.strategies.forEach(strategy => {
                const strategyItem = document.createElement('div');
                strategyItem.className = 'strategy-item';
                
                const description = document.createElement('div');
                description.className = 'strategy-description';
                description.textContent = strategy.description;
                
                const savings = document.createElement('div');
                savings.className = 'strategy-savings';
                savings.innerHTML = `Save <strong>${strategy.monthsSaved} months</strong> and <strong>${formatCurrency(strategy.interestSaved)}</strong> in interest`;
                
                strategyItem.appendChild(description);
                strategyItem.appendChild(savings);
                strategiesSection.appendChild(strategyItem);
            });
        }
        
        // Update chart
        updateDebtChart(result.payoffData);
        
        // Show results section and chart
        document.getElementById('debt-result').classList.remove('hidden');
        document.getElementById('debt-chart-container').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error calculating debt payoff:', error);
        showNotification('Failed to calculate debt payoff. Please try again.', 'error');
    }
}

/**
 * Update the debt payoff chart with calculation results
 * @param {Array} payoffData - Array of monthly payment data
 */
function updateDebtChart(payoffData) {
    const ctx = document.getElementById('debt-chart').getContext('2d');
    
    // If chart exists, destroy it first
    if (charts.debtPayoff) {
        charts.debtPayoff.destroy();
    }
    
    // Prepare data for chart
    const labels = [];
    const balanceData = [];
    const interestData = [];
    
    payoffData.forEach(data => {
        labels.push(`Month ${data.month}`);
        balanceData.push(data.balance);
        interestData.push(data.interest);
    });
    
    // Create new chart
    charts.debtPayoff = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Remaining Balance',
                    data: balanceData,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.1
                },
                {
                    label: 'Monthly Interest',
                    data: interestData,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    tension: 0.1
                }
            ]
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
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD'
                                }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Handle budget analysis calculation form submission
 * @param {Event} e - Form submission event
 */
async function handleBudgetCalculation(e) {
    e.preventDefault();
    
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating...';
    submitButton.disabled = true;
    
    try {
        // Get basic inputs
        const monthlyIncome = parseFloat(document.getElementById('monthly-income').value) || 0;
        const savingsGoalPercent = parseFloat(document.getElementById('savings-goal').value) || 0;
        
        // Get regular expenses
        const expenses = [];
        document.querySelectorAll('#expense-inputs .expense-input').forEach(input => {
            const category = input.querySelector('.expense-category').value;
            const amount = parseFloat(input.querySelector('.expense-amount').value) || 0;
            
            if (amount > 0) {
                expenses.push({ category, amount });
            }
        });
        
        // Get fixed expenses (needs)
        const fixedExpenses = [];
        document.querySelectorAll('#fixed-expense-inputs .expense-input').forEach(input => {
            const category = input.querySelector('.expense-category').value;
            const amount = parseFloat(input.querySelector('.expense-amount').value) || 0;
            
            if (amount > 0) {
                fixedExpenses.push({ category, amount });
            }
        });
        
        // Get variable expenses (wants)
        const variableExpenses = [];
        document.querySelectorAll('#variable-expense-inputs .expense-input').forEach(input => {
            const category = input.querySelector('.expense-category').value;
            const amount = parseFloat(input.querySelector('.expense-amount').value) || 0;
            
            if (amount > 0) {
                variableExpenses.push({ category, amount });
            }
        });
        
        // Get financial goals
        const financialGoals = [];
        document.querySelectorAll('#financial-goal-inputs .financial-goal-input').forEach(input => {
            const name = input.querySelector('.goal-name').value;
            const targetAmount = parseFloat(input.querySelector('.goal-target').value) || 0;
            const currentAmount = parseFloat(input.querySelector('.goal-current').value) || 0;
            const allocationPercentage = parseFloat(input.querySelector('.goal-allocation').value) || 0;
            
            if (name && targetAmount > 0) {
                financialGoals.push({
                    name,
                    targetAmount,
                    currentAmount,
                    allocationPercentage
                });
            }
        });
        
        // Validate inputs
        if (monthlyIncome <= 0) {
            showNotification('Please enter a valid monthly income', 'error');
            return;
        }
        
        if (expenses.length === 0 && fixedExpenses.length === 0 && variableExpenses.length === 0) {
            showNotification('Please enter at least one expense', 'error');
            return;
        }
        
        // If no fixed/variable expenses are provided, categorize regular expenses
        if (fixedExpenses.length === 0 && variableExpenses.length === 0 && expenses.length > 0) {
            // Default categorization of common expenses
            const fixedCategories = ['Housing', 'Utilities', 'Insurance', 'Debt Payments'];
            
            expenses.forEach(expense => {
                if (fixedCategories.includes(expense.category)) {
                    fixedExpenses.push(expense);
                } else {
                    variableExpenses.push(expense);
                }
            });
        }
        
        // Send data to backend
        const response = await fetch('/api/calculations/budget-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                monthlyIncome,
                expenses,
                savingsGoalPercent,
                fixedExpenses,
                variableExpenses,
                financialGoals
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to analyze budget');
        }
        
        const result = await response.json();
        
        // Update summary tab
        document.getElementById('budget-income').textContent = formatCurrency(result.income);
        document.getElementById('budget-total-expenses').textContent = formatCurrency(result.totalExpenses);
        document.getElementById('budget-current-savings').textContent = formatCurrency(result.currentSavings);
        document.getElementById('budget-savings-rate').textContent = `${result.savingsRate}%`;
        document.getElementById('budget-savings-goal').textContent = formatCurrency(result.savingsGoal);
        document.getElementById('budget-savings-gap').textContent = formatCurrency(result.savingsGap);
        
        // Update goal status indicator
        const goalIndicator = document.getElementById('budget-goal-indicator');
        const goalMessage = document.getElementById('budget-goal-message');
        
        if (result.meetingSavingsGoal) {
            goalIndicator.className = 'status-indicator success';
            goalMessage.textContent = 'Meeting savings goal!';
        } else {
            goalIndicator.className = 'status-indicator warning';
            goalMessage.textContent = `Not meeting savings goal. Gap: ${formatCurrency(result.savingsGap)}`;
        }
        
        // Update budget distribution tab
        document.getElementById('needs-percentage').textContent = `${result.budgetDistribution.needs.percentage}%`;
        document.getElementById('needs-amount').textContent = formatCurrency(result.budgetDistribution.needs.amount);
        document.getElementById('wants-percentage').textContent = `${result.budgetDistribution.wants.percentage}%`;
        document.getElementById('wants-amount').textContent = formatCurrency(result.budgetDistribution.wants.amount);
        document.getElementById('savings-percentage').textContent = `${result.budgetDistribution.savings.percentage}%`;
        document.getElementById('savings-amount').textContent = formatCurrency(result.budgetDistribution.savings.amount);
        
        // Update progress bars
        document.getElementById('needs-percentage-bar').style.width = `${result.budgetDistribution.needs.percentage}%`;
        document.getElementById('wants-percentage-bar').style.width = `${result.budgetDistribution.wants.percentage}%`;
        document.getElementById('savings-percentage-bar').style.width = `${result.budgetDistribution.savings.percentage}%`;
        
        // Update budget health tab
        document.getElementById('budget-health-score').textContent = result.budgetHealth.score;
        
        const healthStatus = document.getElementById('budget-health-status');
        healthStatus.textContent = result.budgetHealth.status;
        healthStatus.className = `health-status-value ${result.budgetHealth.status.toLowerCase()}`;
        
        document.getElementById('budget-health-description').textContent = result.budgetHealth.description;
        
        // Position the health meter pointer
        const healthMeterPointer = document.getElementById('health-meter-pointer');
        const pointerPosition = (result.budgetHealth.score / 100) * 100;
        healthMeterPointer.style.left = `${pointerPosition}%`;
        
        // Update financial goals tab
        const goalsContainer = document.getElementById('financial-goals-results');
        goalsContainer.innerHTML = '';
        
        if (result.goalsProgress && result.goalsProgress.length > 0) {
            result.goalsProgress.forEach(goal => {
                const goalCard = document.createElement('div');
                goalCard.className = 'goal-card';
                
                goalCard.innerHTML = `
                    <div class="goal-header">
                        <div class="goal-name">${goal.name}</div>
                        <div class="goal-amount">${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}</div>
                    </div>
                    <div class="goal-progress-container">
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: ${goal.progress}%"></div>
                        </div>
                        <div class="goal-progress-text">
                            <div>Progress</div>
                            <div class="goal-progress-percent">${goal.progress}%</div>
                        </div>
                    </div>
                    <div class="goal-eta">
                        ${goal.monthsToTarget > 0 ? 
                            `Estimated time to goal: <span class="goal-eta-months">${goal.monthsToTarget} months</span>` : 
                            '<span class="goal-eta-months">Goal reached!</span>'}
                    </div>
                `;
                
                goalsContainer.appendChild(goalCard);
            });
        } else {
            goalsContainer.innerHTML = '<p class="no-goals-message">No financial goals have been set.</p>';
        }
        
        // Update recommendations tab
        const recommendationsContainer = document.getElementById('budget-recommendations');
        recommendationsContainer.innerHTML = '';
        
        if (result.recommendations && result.recommendations.length > 0) {
            result.recommendations.forEach(rec => {
                const recItem = document.createElement('div');
                recItem.className = `recommendation-item priority-${rec.priority || 'medium'}`;
                recItem.textContent = rec.text;
                recommendationsContainer.appendChild(recItem);
            });
        } else {
            recommendationsContainer.innerHTML = '<p>No specific recommendations at this time.</p>';
        }
        
        // Update charts
        updateBudgetChart(result.expenseBreakdown);
        updateBudgetDistributionChart(result.budgetDistribution);
        
        // Show results section
        document.getElementById('budget-result').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error analyzing budget:', error);
        showNotification('Failed to analyze budget. Please try again.', 'error');
    } finally {
        // Restore button state
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
}

/**
 * Update the budget analysis chart with calculation results
 * @param {Array} expenseBreakdown - Array of expense category data
 */
function updateBudgetChart(expenseBreakdown) {
    const ctx = document.getElementById('budget-chart').getContext('2d');
    
    // If chart exists, destroy it first
    if (charts.budget) {
        charts.budget.destroy();
    }
    
    // Prepare data for chart
    const labels = [];
    const data = [];
    const backgroundColors = [];
    
    expenseBreakdown.forEach((expense, index) => {
        labels.push(expense.category);
        data.push(expense.amount);
        backgroundColors.push(chartColors[index % chartColors.length]);
    });
    
    // Create new chart
    charts.budget = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map(function(label, i) {
                                    const meta = chart.getDatasetMeta(0);
                                    const style = meta.controller.getStyle(i);
                                    const percentage = Math.round(data.datasets[0].data[i] / data.datasets[0].data.reduce((a, b) => a + b, 0) * 100);
                                    
                                    return {
                                        text: `${label}: ${percentage}%`,
                                        fillStyle: style.backgroundColor,
                                        strokeStyle: style.borderColor,
                                        lineWidth: style.borderWidth,
                                        hidden: isNaN(data.datasets[0].data[i]) || meta.data[i].hidden,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Update the budget distribution chart showing the 50/30/20 rule comparison
 * @param {Object} budgetDistribution - Object containing needs, wants, and savings data
 */
function updateBudgetDistributionChart(budgetDistribution) {
    const ctx = document.getElementById('budget-distribution-chart').getContext('2d');
    
    // If chart exists, destroy it first
    if (charts.budgetDistribution) {
        charts.budgetDistribution.destroy();
    }
    
    // Prepare data for chart
    const labels = ['Needs (50%)', 'Wants (30%)', 'Savings (20%)'];
    const actualData = [
        budgetDistribution.needs.percentage,
        budgetDistribution.wants.percentage,
        budgetDistribution.savings.percentage
    ];
    const recommendedData = [50, 30, 20];
    
    // Create new chart
    charts.budgetDistribution = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Your Budget',
                    data: actualData,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(75, 192, 192, 0.7)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                },
                {
                    label: 'Recommended',
                    data: recommendedData,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 159, 64, 0.2)',
                        'rgba(75, 192, 192, 0.2)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Percentage of Income'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value}%`;
                        }
                    }
                }
            }
        }
    });
}
