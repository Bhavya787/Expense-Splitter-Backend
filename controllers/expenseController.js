const Expense = require("../models/expenseModel");

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Public
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
// @access  Public
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
// @access  Public
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, paidBy, participants } = req.body;

    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (amount && amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    expense.description = description || expense.description;
    expense.amount = amount || expense.amount;
    expense.paidBy = paidBy || expense.paidBy;
    expense.participants = participants || expense.participants;

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

