const express = require("express");
const router = express.Router();
const {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

router.route("/").get(getExpenses).post(addExpense);
router.route("/:id").put(updateExpense).delete(deleteExpense);

module.exports = router;

