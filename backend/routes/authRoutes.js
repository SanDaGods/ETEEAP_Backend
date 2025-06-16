const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// POST /api/register
router.post("/register", authController.register);

module.exports = router;
