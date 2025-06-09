const mongoose = require("mongoose");

const expenseSchema = mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    amount: {
      type: Number,
      required: [true, "Please add an amount"],
    },
    paidBy: {
      type: String,
      required: [true, "Please add who paid"],
    },
    participants: [
      {
        name: { type: String, required: true },
        share: { type: Number, required: true }, // Can be percentage, exact amount, or share unit
        type: { type: String, enum: ["percentage", "exact", "share"], default: "exact" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Expense", expenseSchema);

