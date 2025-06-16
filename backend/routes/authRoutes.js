const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Applicant = require("../models/Applicant"); // adjust path

router.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newApplicant = new Applicant({ email, password: hashedPassword });
    await newApplicant.save();

    res.json({ success: true, message: "Registered!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error", details: err.message });
  }
});

module.exports = router;
