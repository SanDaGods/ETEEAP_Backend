const mongoose = require("mongoose");
const { JWT_SECRET } = require("../config/constants");

// Mock registration (replace with real DB logic)
exports.register = async (req, res) => {
  try {
    console.log("REQ BODY (register):", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Generate a new ObjectId for userId
    const userId = new mongoose.Types.ObjectId().toString();

    return res.status(201).json({
      message: "Registration successful",
      data: {
        userId, // send the new ObjectId as string
        applicantId: "mockApplicantId456", // or generate real applicantId if needed
        email,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ success: false, error: "Internal error", message: err.message });
  }
};

// Mock login (replace with real user lookup)
exports.login = async (req, res) => {
  try {
    console.log("REQ BODY (login):", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Generate a valid ObjectId for demo purposes
    const userId = new mongoose.Types.ObjectId().toString();

    return res.status(200).json({
      message: "Login successful",
      data: {
        userId, // send the valid ObjectId as string
        email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, error: "Internal error", message: err.message });
  }
};
