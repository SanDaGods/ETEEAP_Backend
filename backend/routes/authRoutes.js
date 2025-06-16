const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Applicant = require("../models/Applicant"); // make sure this path is correct

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    const existing = await Applicant.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const applicant = new Applicant({ email, password: hashedPassword });

    await applicant.save();

    res.status(201).json({ success: true, message: "Registration successful" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, error: "Internal server error", details: err.message });
  }
});

module.exports = router;
