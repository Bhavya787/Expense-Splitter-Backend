const Expense = require("../models/expenseModel");


// @route   GET /api/expenses
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({});
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


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

    // Handle amount update and participant share adjustment
    // If participants are explicitly provided, they override any automatic adjustments
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
      expense.amount = amount !== undefined ? amount : expense.amount; // Update amount if provided with participants
    } else if (amount !== undefined && amount !== expense.amount) {
      // If amount is updated but participants are NOT explicitly provided, re-calculate shares equally
      if (expense.participants && expense.participants.length > 0) {
        const numParticipants = expense.participants.length;
        const newSharePerPerson = parseFloat((amount / numParticipants).toFixed(2));
        expense.participants = expense.participants.map(p => ({
          ...p.toObject(),
          share: newSharePerPerson,
          type: "exact" // Assuming equal split implies exact share type
        }));
      }
      expense.amount = amount;
    }

    const updatedExpense = await expense.save();

    res.status(200).json({ success: true, data: updatedExpense, message: "Expense updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @route   DELETE /api/expenses/:id
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

