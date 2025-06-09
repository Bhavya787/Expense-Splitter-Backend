const Expense = require("../models/expenseModel");

// @desc    Get all expenses
// @route   GET /api/expenses
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({});
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new expense
// @route   POST /api/expenses
const addExpense = async (req, res) => {
  try {
    const { description, amount, paidBy, participants } = req.body;

    if (!description || !amount || !paidBy) {
      return res.status(400).json({ message: "Please enter all required fields: description, amount, paidBy" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    const expense = await Expense.create({
      description,
      amount,
      paidBy,
      participants: participants || [],
    });

    res.status(201).json({ success: true, data: expense, message: "Expense added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, paidBy, participants } = req.body;

    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Validate amount if provided
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }
    }

    // Validate description if provided and not empty
    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({ message: "Description cannot be empty" });
      }
      expense.description = description;
    }

    // Validate paidBy if provided and not empty
    if (paidBy !== undefined) {
      if (typeof paidBy !== 'string' || paidBy.trim() === '') {
        return res.status(400).json({ message: "PaidBy cannot be empty" });
      }
      expense.paidBy = paidBy;
    }

    // Store original amount for proportional scaling if only amount is updated
    const originalAmount = expense.amount;

    // Handle amount update and proportional participant share adjustment
    if (amount !== undefined && amount !== originalAmount) {
      if (expense.participants && expense.participants.length > 0) {
        const ratio = amount / originalAmount;
        expense.participants = expense.participants.map(p => ({
          ...p.toObject(), // Convert Mongoose document to plain object
          share: parseFloat((p.share * ratio).toFixed(2))
        }));
      }
      expense.amount = amount;
    }

    // If participants are explicitly provided in the request, they override any automatic adjustments
    if (participants !== undefined) {
      if (!Array.isArray(participants)) {
        return res.status(400).json({ message: "Participants must be an array" });
      }
      for (const p of participants) {
        if (!p.name || typeof p.share === 'undefined') {
          return res.status(400).json({ message: "Each participant must have a name and a share" });
        }
        if (typeof p.name !== 'string' || p.name.trim() === '') {
          return res.status(400).json({ message: "Participant name cannot be empty" });
        }
        if (typeof p.share !== 'number' || p.share < 0) {
          return res.status(400).json({ message: "Participant share must be a non-negative number" });
        }
      }
      expense.participants = participants;
    }

    const updatedExpense = await expense.save();

    res.status(200).json({ success: true, data: updatedExpense, message: "Expense updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Public
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await expense.deleteOne();

    res.status(200).json({ success: true, message: "Expense removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
};

