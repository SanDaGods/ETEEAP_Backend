const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// POST /api/register
router.post("/register", authController.register);

module.exports = router;

router.get("/ping", (req, res) => {
  res.json({ success: true, message: "Ping successful" });
});
