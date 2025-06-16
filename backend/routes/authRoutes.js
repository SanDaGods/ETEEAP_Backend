const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Applicant = require("../models/Applicant"); // Check path!

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const existing = await Applicant.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newApplicant = new Applicant({ email, password: hashedPassword });

    await newApplicant.save();

    res.status(201).json({
      success: true,
      data: {
        userId: newApplicant._id,
        applicantId: newApplicant._id, // adjust if different
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, error: "Internal server error", details: err.message });
  }
});

module.exports = router;
