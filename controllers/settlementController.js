const Expense = require("../models/expenseModel");

// Helper function to calculate balances
const calculateBalances = async () => {
  const expenses = await Expense.find({});
  const balances = {};

  // First, get all people involved in expenses (needed for fallback logic)
  const allPeople = new Set();
  expenses.forEach(expense => {
    allPeople.add(expense.paidBy);
    if (expense.participants && expense.participants.length > 0) {
      expense.participants.forEach(p => allPeople.add(p.name));
    }
  });

  expenses.forEach((expense) => {
    const paidBy = expense.paidBy;
    const amount = expense.amount;

    // Initialize balance for payer if not exists
    if (!balances[paidBy]) {
      balances[paidBy] = 0;
    }
    // Person who paid gets credited
    balances[paidBy] += amount;

    // Handle different splitting scenarios
    if (expense.participants && expense.participants.length > 0) {
      expense.participants.forEach((participant) => {
        // Initialize balance for participant if not exists
        if (!balances[participant.name]) {
          balances[participant.name] = 0;
        }

        let shareAmount = 0;

        if (participant.type === "percentage") {
          shareAmount = (amount * participant.share) / 100;
        } else if (participant.type === "exact") {
          shareAmount = participant.share;
        } else if (participant.type === "share") {
          // Calculate proportional share
          const totalShares = expense.participants.reduce((sum, p) => {
            return sum + (p.type === "share" ? p.share : 0);
          }, 0);
          
          if (totalShares > 0) {
            shareAmount = (amount * participant.share) / totalShares;
          }
        }

        // Participant owes their share
        balances[participant.name] -= shareAmount;
      });
    } else {
      // No participants specified - split equally among all people
      const sharePerPerson = amount / allPeople.size;
      
      allPeople.forEach(person => {
        if (!balances[person]) {
          balances[person] = 0;
        }
        balances[person] -= sharePerPerson;
      });
    }
  });

  return balances;
};

// @desc    Get all people involved in expenses
// @route   GET /api/people
// @access  Public
const getPeople = async (req, res) => {
  try {
    const expenses = await Expense.find({});
    const people = new Set();
    
    expenses.forEach((expense) => {
      people.add(expense.paidBy);
      if (expense.participants && expense.participants.length > 0) {
        expense.participants.forEach((p) => people.add(p.name));
      }
    });
    
    res.status(200).json(Array.from(people));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current balances (owes/owed)
// @route   GET /api/balances
// @access  Public
const getBalances = async (req, res) => {
  try {
    const balances = await calculateBalances();
    res.status(200).json(balances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Calculate simplified settlements
// @route   GET /api/settlements
// @access  Public
const getSettlements = async (req, res) => {
  try {
    const balances = await calculateBalances();
    const creditors = [];
    const debtors = [];

    // Separate creditors (owed money) and debtors (owe money)
    for (const person in balances) {
      if (balances[person] > 0.01) { // Small tolerance for floating point errors
        creditors.push({ person, amount: balances[person] });
      } else if (balances[person] < -0.01) {
        debtors.push({ person, amount: Math.abs(balances[person]) });
      }
    }

    // Sort by amount (largest first) for optimal settlement
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const settlements = [];

    // Calculate minimum transactions needed
    while (creditors.length > 0 && debtors.length > 0) {
      const creditor = creditors[0];
      const debtor = debtors[0];

      const settlementAmount = Math.min(creditor.amount, debtor.amount);
      
      // Round to 2 decimal places to avoid floating point issues
      const roundedAmount = Math.round(settlementAmount * 100) / 100;

      if (roundedAmount > 0.01) { // Only add settlements above 1 cent
        settlements.push({
          from: debtor.person,
          to: creditor.person,
          amount: roundedAmount,
        });
      }

      creditor.amount -= settlementAmount;
      debtor.amount -= settlementAmount;

      // Remove settled parties
      if (creditor.amount < 0.01) {
        creditors.shift();
      }
      if (debtor.amount < 0.01) {
        debtors.shift();
      }
    }

    res.status(200).json(settlements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPeople,
  getBalances,
  getSettlements,
};