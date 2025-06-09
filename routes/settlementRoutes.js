const express = require("express");
const router = express.Router();
const {
  getPeople,
  getBalances,
  getSettlements,
} = require("../controllers/settlementController");

router.route("/people").get(getPeople);
router.route("/balances").get(getBalances);
router.route("/settlements").get(getSettlements);

module.exports = router;

