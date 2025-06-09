const Expense = require("../models/expenseModel");

// Helper function to calculate balances
const calculateBalances = async () => {
  const expenses = await Expense.find({});
  const balances = {};

  expenses.forEach((expense) => {
    const paidBy = expense.paidBy;
    const amount = expense.amount;

    if (!balances[paidBy]) {
      balances[paidBy] = 0;
    }
    balances[paidBy] += amount;

    let totalShare = 0;
    if (expense.participants && expense.participants.length > 0) {
      expense.participants.forEach((p) => {
        if (p.type === "percentage") {
          totalShare += (amount * p.share) / 100;
        } else if (p.type === "exact") {
          totalShare += p.share;
        } else if (p.type === "share") {
          // For 'share' type, we'll assume equal distribution if not specified otherwise
          // This part might need more complex logic based on how 'share' is defined
          // For now, we'll treat it as an equal share if no specific value is given
          totalShare += p.share; // Assuming p.share is the actual share value
        }
      });
    } else {
      // If no participants are specified, assume equal split among all people involved in expenses
      // This is a simplification and might need refinement based on exact requirements
      const allPeople = new Set();
      expenses.forEach(e => {
        allPeople.add(e.paidBy);
        e.participants.forEach(p => allPeople.add(p.name));
      });
      const numPeople = allPeople.size;
      if (numPeople > 0) {
        totalShare = amount; // Distribute total amount among all people
      }
    }

    if (expense.participants && expense.participants.length > 0) {
      expense.participants.forEach((p) => {
        if (!balances[p.name]) {
          balances[p.name] = 0;
        }
        if (p.type === "percentage") {
          balances[p.name] -= (amount * p.share) / 100;
        } else if (p.type === "exact") {
          balances[p.name] -= p.share;
        } else if (p.type === "share") {
          balances[p.name] -= p.share; // Assuming p.share is the actual share value
        }
      });
    } else {
      // If no participants, distribute equally among all people involved in expenses
      const allPeople = new Set();
      expenses.forEach(e => {
        allPeople.add(e.paidBy);
        e.participants.forEach(p => allPeople.add(p.name));
      });
      const numPeople = allPeople.size;
      if (numPeople > 0) {
        const sharePerPerson = amount / numPeople;
        allPeople.forEach(person => {
          if (!balances[person]) {
            balances[person] = 0;
          }
          balances[person] -= sharePerPerson;
        });
      }
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
      expense.participants.forEach((p) => people.add(p.name));
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

    for (const person in balances) {
      if (balances[person] > 0) {
        creditors.push({ person, amount: balances[person] });
      } else if (balances[person] < 0) {
        debtors.push({ person, amount: Math.abs(balances[person]) });
      }
    }

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const settlements = [];

    while (creditors.length > 0 && debtors.length > 0) {
      const creditor = creditors[0];
      const debtor = debtors[0];

      const minAmount = Math.min(creditor.amount, debtor.amount);

      settlements.push({
        from: debtor.person,
        to: creditor.person,
        amount: minAmount,
      });

      creditor.amount -= minAmount;
      debtor.amount -= minAmount;

      if (creditor.amount === 0) {
        creditors.shift();
      }
      if (debtor.amount === 0) {
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

