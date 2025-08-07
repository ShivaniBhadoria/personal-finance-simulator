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
    savingsGoalPercent
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
  
  res.json({
    income: monthlyIncome,
    totalExpenses,
    currentSavings,
    savingsRate,
    savingsGoal,
    savingsGap,
    meetingSavingsGoal: currentSavings >= savingsGoal,
    expenseBreakdown: expensePercentages
  });
});

module.exports = router;
//adding comment
