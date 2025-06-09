const Expense = require("../models/expenseModel");

// Helper function to validate participant data
const validateParticipants = (participants, amount) => {
  if (!Array.isArray(participants)) {
    return { valid: false, message: "Participants must be an array" };
  }

  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];
    
    if (!p.name || typeof p.name !== 'string') {
      return { valid: false, message: `Participant ${i + 1} must have a valid name` };
    }
    
    if (!p.type || !['percentage', 'exact', 'share'].includes(p.type)) {
      return { valid: false, message: `Participant ${i + 1} must have a valid type (percentage, exact, or share)` };
    }
    
    if (typeof p.share !== 'number' || p.share <= 0) {
      return { valid: false, message: `Participant ${i + 1} must have a positive share value` };
    }
    
    if (p.type === 'percentage' && p.share > 100) {
      return { valid: false, message: `Participant ${i + 1} percentage cannot exceed 100%` };
    }
    
    if (p.type === 'exact' && p.share > amount) {
      return { valid: false, message: `Participant ${i + 1} exact amount cannot exceed total expense amount` };
    }
  }

  // Additional validation for percentage totals
  const percentageParticipants = participants.filter(p => p.type === 'percentage');
  if (percentageParticipants.length > 0) {
    const totalPercentage = percentageParticipants.reduce((sum, p) => sum + p.share, 0);
    if (totalPercentage > 100) {
      return { valid: false, message: "Total percentage cannot exceed 100%" };
    }
  }

  // Additional validation for exact amount totals
  const exactParticipants = participants.filter(p => p.type === 'exact');
  if (exactParticipants.length > 0) {
    const totalExact = exactParticipants.reduce((sum, p) => sum + p.share, 0);
    if (totalExact > amount) {
      return { valid: false, message: "Total exact amounts cannot exceed expense amount" };
    }
  }

  return { valid: true };
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Public
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({}).sort({ createdAt: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Public
const getExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json(expense);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid expense ID format" });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new expense
// @route   POST /api/expenses
// @access  Public
const addExpense = async (req, res) => {
  try {
    const { description, amount, paidBy, participants } = req.body;

    // Validate required fields
    if (!description || !amount || !paidBy) {
      return res.status(400).json({ 
        message: "Please enter all required fields: description, amount, paidBy" 
      });
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ 
        message: "Amount must be a positive number" 
      });
    }

    // Validate paidBy
    if (typeof paidBy !== 'string' || paidBy.trim().length === 0) {
      return res.status(400).json({ 
        message: "PaidBy must be a valid name" 
      });
    }

    // Validate participants if provided
    const participantsArray = participants || [];
    if (participantsArray.length > 0) {
      const validation = validateParticipants(participantsArray, amount);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }
    }

    const expense = await Expense.create({
      description: description.trim(),
      amount: parseFloat(amount.toFixed(2)),
      paidBy: paidBy.trim(),
      participants: participantsArray,
    });

    res.status(201).json({ 
      success: true, 
      data: expense, 
      message: "Expense added successfully" 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
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

    // Validate amount if provided
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ 
          message: "Amount must be a positive number" 
        });
      }
    }

    // Validate paidBy if provided
    if (paidBy !== undefined) {
      if (typeof paidBy !== 'string' || paidBy.trim().length === 0) {
        return res.status(400).json({ 
          message: "PaidBy must be a valid name" 
        });
      }
    }

    // Store original amount for potential scaling
    const originalAmount = expense.amount;
    const newAmount = amount !== undefined ? amount : originalAmount;

    // Update basic fields if provided
    if (description !== undefined) {
      expense.description = description.trim();
    }
    if (paidBy !== undefined) {
      expense.paidBy = paidBy.trim();
    }

    // Handle participants update
    let updatedParticipants = expense.participants;

    // If participants are explicitly provided, validate and use them
    if (participants !== undefined) {
      if (participants.length > 0) {
        const validation = validateParticipants(participants, newAmount);
        if (!validation.valid) {
          return res.status(400).json({ message: validation.message });
        }
      }
      updatedParticipants = participants;
    } else if (amount !== undefined && amount !== originalAmount && expense.participants.length > 0) {
      // Handle amount update with proportional participant share adjustment
      // Only scale exact amounts, leave percentages and shares unchanged
      const ratio = newAmount / originalAmount;
      updatedParticipants = expense.participants.map(p => {
        const participant = p.toObject ? p.toObject() : { ...p };
        
        // Only scale exact amounts
        if (participant.type === 'exact') {
          participant.share = parseFloat((participant.share * ratio).toFixed(2));
        }
        // Percentages and shares remain unchanged as they are proportional by nature
        
        return participant;
      });

      // Validate the scaled participants
      if (updatedParticipants.length > 0) {
        const validation = validateParticipants(updatedParticipants, newAmount);
        if (!validation.valid) {
          return res.status(400).json({ 
            message: `After scaling: ${validation.message}` 
          });
        }
      }
    }

    // Update the expense
    if (amount !== undefined) {
      expense.amount = parseFloat(newAmount.toFixed(2));
    }
    expense.participants = updatedParticipants;

    const updatedExpense = await expense.save();

    res.status(200).json({ 
      success: true, 
      data: updatedExpense, 
      message: "Expense updated successfully" 
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid expense ID format" });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
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

    res.status(200).json({ 
      success: true, 
      message: "Expense removed successfully" 
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid expense ID format" });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getExpenses,
  getExpense,
  addExpense,
  updateExpense,
  deleteExpense,
};
