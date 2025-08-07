const express = require('express');
const router = express.Router();

// Helper function to calculate compound interest
const calculateCompoundInterest = (principal, monthlyContribution, annualRate, years) => {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;
  let balance = principal;
  
  const monthlyData = [];
  
  for (let month = 1; month <= totalMonths; month++) {
    // Add monthly contribution
    balance += monthlyContribution;
    
    // Calculate interest for this month
    const interest = balance * monthlyRate;
    
    // Add interest to balance
    balance += interest;
    
    // Store data point
    if (month % 12 === 0 || month === 1 || month === totalMonths) {
      monthlyData.push({
        month,
        year: Math.ceil(month / 12),
        balance: parseFloat(balance.toFixed(2)),
        interest: parseFloat(interest.toFixed(2))
      });
    }
  }
  
  return {
    finalBalance: parseFloat(balance.toFixed(2)),
    totalInterest: parseFloat((balance - principal - (monthlyContribution * totalMonths)).toFixed(2)),
    monthlyData
  };
};

// Calculate investment growth over time
router.post('/investment-growth', (req, res) => {
  const { 
    initialAmount, 
    monthlyContribution, 
    annualReturnRate, 
    years 
  } = req.body;
  
  if (
    typeof initialAmount !== 'number' || 
    typeof monthlyContribution !== 'number' || 
    typeof annualReturnRate !== 'number' || 
    typeof years !== 'number'
  ) {
    return res.status(400).json({ 
      message: 'Invalid input. All values must be numbers.' 
    });
  }
  
  const result = calculateCompoundInterest(
    initialAmount,
    monthlyContribution,
    annualReturnRate,
    years
  );
  
  res.json(result);
});

// Calculate retirement projection
router.post('/retirement-projection', (req, res) => {
  const {
    currentAge,
    retirementAge,
    lifeExpectancy,
    currentSavings,
    monthlySavings,
    annualReturnRate,
    inflationRate,
    monthlyExpensesInRetirement
  } = req.body;
  
  // Calculate pre-retirement growth
  const yearsToRetirement = retirementAge - currentAge;
  const preRetirementGrowth = calculateCompoundInterest(
    currentSavings,
    monthlySavings,
    annualReturnRate,
    yearsToRetirement
  );
  
  // Calculate post-retirement scenario
  const yearsInRetirement = lifeExpectancy - retirementAge;
  const retirementBalance = preRetirementGrowth.finalBalance;
  
  // Adjust for inflation
  const realReturnRate = annualReturnRate - inflationRate;
  
  // Calculate withdrawal phase
  const postRetirementProjection = calculateCompoundInterest(
    retirementBalance,
    -monthlyExpensesInRetirement, // Negative for withdrawal
    realReturnRate,
    yearsInRetirement
  );
  
  res.json({
    preRetirement: preRetirementGrowth,
    postRetirement: postRetirementProjection,
    summary: {
      retirementSavings: retirementBalance,
      finalBalance: postRetirementProjection.finalBalance,
      sustainable: postRetirementProjection.finalBalance > 0
    }
  });
});

// Calculate debt payoff
router.post('/debt-payoff', (req, res) => {
  const { 
    debtAmount, 
    interestRate, 
    monthlyPayment 
  } = req.body;
  
  if (
    typeof debtAmount !== 'number' || 
    typeof interestRate !== 'number' || 
    typeof monthlyPayment !== 'number'
  ) {
    return res.status(400).json({ 
      message: 'Invalid input. All values must be numbers.' 
    });
  }
  
  // Validate minimum payment
  const monthlyRate = interestRate / 100 / 12;
  const minimumPayment = debtAmount * monthlyRate;
  
  if (monthlyPayment <= minimumPayment && interestRate > 0) {
    return res.status(400).json({
      message: `Monthly payment must be greater than minimum interest payment of $${minimumPayment.toFixed(2)}`
    });
  }
  
  let balance = debtAmount;
  let month = 0;
  let totalInterest = 0;
  const payoffData = [];
  
  // Calculate how long it will take to pay off the debt
  while (balance > 0 && month < 1200) { // Cap at 100 years to prevent infinite loops
    month++;
    
    // Calculate interest for this month
    const interest = balance * monthlyRate;
    totalInterest += interest;
    
    // Calculate payment for this month (don't overpay)
    const payment = Math.min(monthlyPayment, balance + interest);
    
    // Update balance
    balance = balance + interest - payment;
    
    // Store data point (yearly or first/last month)
    if (month % 12 === 0 || month === 1 || balance <= 0 || month % 3 === 0) {
      payoffData.push({
        month,
        year: parseFloat((month / 12).toFixed(1)),
        balance: parseFloat(Math.max(0, balance).toFixed(2)),
        interest: parseFloat(interest.toFixed(2)),
        payment: parseFloat(payment.toFixed(2)),
        totalInterestToDate: parseFloat(totalInterest.toFixed(2))
      });
    }
  }
  
  // If we hit the cap, return an error
  if (month >= 1200) {
    return res.status(400).json({
      message: 'With the current payment amount, this debt will take too long to pay off. Please increase your monthly payment.'
    });
  }
  
  // Calculate savings with different payment strategies
  const strategies = [];
  
  // Strategy 1: Pay 10% more each month
  if (monthlyPayment * 1.1 < monthlyPayment + 1000) {
    const additionalPayment = parseFloat((monthlyPayment * 0.1).toFixed(2));
    const newPayment = monthlyPayment + additionalPayment;
    let newBalance = debtAmount;
    let newMonth = 0;
    let newTotalInterest = 0;
    
    while (newBalance > 0 && newMonth < 1200) {
      newMonth++;
      const interest = newBalance * monthlyRate;
      newTotalInterest += interest;
      const payment = Math.min(newPayment, newBalance + interest);
      newBalance = newBalance + interest - payment;
    }
    
    if (newMonth < month) {
      strategies.push({
        description: `Paying an extra $${additionalPayment} per month`,
        monthsSaved: month - newMonth,
        interestSaved: parseFloat((totalInterest - newTotalInterest).toFixed(2))
      });
    }
  }
  
  res.json({
    monthsToPayoff: month,
    yearsToPayoff: parseFloat((month / 12).toFixed(2)),
    totalInterestPaid: parseFloat(totalInterest.toFixed(2)),
    totalPaid: parseFloat((debtAmount + totalInterest).toFixed(2)),
    payoffData,
    strategies
  });
});

// Calculate budget analysis
router.post('/budget-analysis', (req, res) => {
  const { 
    monthlyIncome, 
    expenses,
    savingsGoalPercent,
    fixedExpenses = [],
    variableExpenses = [],
    financialGoals = []
  } = req.body;
  
  if (
    typeof monthlyIncome !== 'number' || 
    !Array.isArray(expenses) ||
    typeof savingsGoalPercent !== 'number'
  ) {
    return res.status(400).json({ 
      message: 'Invalid input. Income must be a number, expenses must be an array, and savings goal must be a number.' 
    });
  }
  
  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate savings
  const currentSavings = monthlyIncome - totalExpenses;
  const savingsRate = parseFloat(((currentSavings / monthlyIncome) * 100).toFixed(2));
  
  // Calculate savings goal
  const savingsGoal = monthlyIncome * (savingsGoalPercent / 100);
  const savingsGap = parseFloat((savingsGoal - currentSavings).toFixed(2));
  
  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.amount;
    return acc;
  }, {});
  
  // Calculate percentages
  const expensePercentages = Object.entries(expensesByCategory).map(([category, amount]) => ({
    category,
    amount,
    percentage: parseFloat(((amount / monthlyIncome) * 100).toFixed(2))
  }));

  // Sort expense percentages by amount (descending)
  expensePercentages.sort((a, b) => b.amount - a.amount);
  
  // Calculate fixed vs variable expense ratio
  const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalVariableExpenses = variableExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate 50/30/20 rule comparison
  const needs = totalFixedExpenses; // Essential expenses (50% recommended)
  const wants = totalVariableExpenses; // Non-essential expenses (30% recommended)
  const savings = currentSavings; // Savings and debt repayment (20% recommended)
  
  const needsPercentage = parseFloat(((needs / monthlyIncome) * 100).toFixed(2));
  const wantsPercentage = parseFloat(((wants / monthlyIncome) * 100).toFixed(2));
  const savingsPercentage = parseFloat(((savings / monthlyIncome) * 100).toFixed(2));
  
  // Budget health indicators
  const budgetHealthScore = calculateBudgetHealthScore(needsPercentage, wantsPercentage, savingsPercentage);
  
  // Financial goals progress
  const goalsProgress = financialGoals.map(goal => {
    const progress = parseFloat(((goal.currentAmount / goal.targetAmount) * 100).toFixed(2));
    const monthsToTarget = goal.targetAmount > goal.currentAmount ? 
      Math.ceil((goal.targetAmount - goal.currentAmount) / (currentSavings * (goal.allocationPercentage / 100))) : 0;
    
    return {
      ...goal,
      progress,
      monthsToTarget
    };
  });
  
  // Recommendations based on budget analysis
  const recommendations = generateRecommendations(
    needsPercentage, 
    wantsPercentage, 
    savingsPercentage, 
    savingsGap, 
    expensePercentages
  );
  
  res.json({
    income: monthlyIncome,
    totalExpenses,
    currentSavings,
    savingsRate,
    savingsGoal,
    savingsGap,
    meetingSavingsGoal: currentSavings >= savingsGoal,
    expenseBreakdown: expensePercentages,
    budgetDistribution: {
      needs: {
        amount: needs,
        percentage: needsPercentage,
        recommended: 50
      },
      wants: {
        amount: wants,
        percentage: wantsPercentage,
        recommended: 30
      },
      savings: {
        amount: savings,
        percentage: savingsPercentage,
        recommended: 20
      }
    },
    budgetHealth: {
      score: budgetHealthScore,
      status: getBudgetHealthStatus(budgetHealthScore),
      description: getBudgetHealthDescription(budgetHealthScore)
    },
    goalsProgress,
    recommendations
  });
});

/**
 * Calculate budget health score based on 50/30/20 rule and other factors
 * @param {number} needsPercentage - Percentage of income spent on needs
 * @param {number} wantsPercentage - Percentage of income spent on wants
 * @param {number} savingsPercentage - Percentage of income saved
 * @returns {number} - Budget health score (0-100)
 */
function calculateBudgetHealthScore(needsPercentage, wantsPercentage, savingsPercentage) {
  // Ideal distribution: 50% needs, 30% wants, 20% savings
  const needsScore = needsPercentage <= 50 ? 100 : Math.max(0, 100 - ((needsPercentage - 50) * 2));
  const wantsScore = wantsPercentage <= 30 ? 100 : Math.max(0, 100 - ((wantsPercentage - 30) * 3));
  const savingsScore = savingsPercentage >= 20 ? 100 : Math.max(0, savingsPercentage * 5);
  
  // Weight the scores (needs: 40%, wants: 30%, savings: 30%)
  return Math.round((needsScore * 0.4) + (wantsScore * 0.3) + (savingsScore * 0.3));
}

/**
 * Get budget health status based on score
 * @param {number} score - Budget health score
 * @returns {string} - Budget health status
 */
function getBudgetHealthStatus(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Critical';
}

/**
 * Get budget health description based on score
 * @param {number} score - Budget health score
 * @returns {string} - Budget health description
 */
function getBudgetHealthDescription(score) {
  if (score >= 80) return 'Your budget is well-balanced and sustainable.';
  if (score >= 60) return 'Your budget is generally healthy but has room for improvement.';
  if (score >= 40) return 'Your budget needs attention in several areas.';
  if (score >= 20) return 'Your budget is at risk and requires significant adjustments.';
  return 'Your budget is in critical condition and needs immediate restructuring.';
}

/**
 * Generate personalized recommendations based on budget analysis
 * @param {number} needsPercentage - Percentage of income spent on needs
 * @param {number} wantsPercentage - Percentage of income spent on wants
 * @param {number} savingsPercentage - Percentage of income saved
 * @param {number} savingsGap - Gap between current savings and goal
 * @param {Array} expenseBreakdown - Breakdown of expenses by category
 * @returns {Array} - List of recommendations
 */
function generateRecommendations(needsPercentage, wantsPercentage, savingsPercentage, savingsGap, expenseBreakdown) {
  const recommendations = [];
  
  // Check needs percentage
  if (needsPercentage > 50) {
    recommendations.push({
      category: 'Needs',
      priority: 'High',
      description: `Your essential expenses (${needsPercentage.toFixed(1)}%) exceed the recommended 50%. Consider finding ways to reduce housing, transportation, or utility costs.`
    });
  }
  
  // Check wants percentage
  if (wantsPercentage > 30) {
    recommendations.push({
      category: 'Wants',
      priority: 'Medium',
      description: `Your discretionary spending (${wantsPercentage.toFixed(1)}%) exceeds the recommended 30%. Look for opportunities to reduce non-essential expenses.`
    });
  }
  
  // Check savings percentage
  if (savingsPercentage < 20) {
    recommendations.push({
      category: 'Savings',
      priority: 'High',
      description: `Your savings rate (${savingsPercentage.toFixed(1)}%) is below the recommended 20%. Aim to increase your savings by reducing expenses or increasing income.`
    });
  }
  
  // Check for high expense categories
  const highExpenseCategories = expenseBreakdown.filter(expense => expense.percentage > 30);
  if (highExpenseCategories.length > 0) {
    highExpenseCategories.forEach(category => {
      recommendations.push({
        category: category.category,
        priority: 'Medium',
        description: `${category.category} accounts for ${category.percentage.toFixed(1)}% of your income, which is relatively high. Consider ways to optimize this expense.`
      });
    });
  }
  
  // Add general recommendations if we don't have many specific ones
  if (recommendations.length < 3) {
    if (savingsGap > 0) {
      recommendations.push({
        category: 'Savings Goal',
        priority: 'Medium',
        description: `You're $${savingsGap.toFixed(2)} short of your monthly savings goal. Consider increasing income or reducing expenses to bridge this gap.`
      });
    }
    
    recommendations.push({
      category: 'Emergency Fund',
      priority: 'Medium',
      description: 'Aim to build an emergency fund covering 3-6 months of expenses for financial security.'
    });
  }
  
  return recommendations;
}

module.exports = router;
