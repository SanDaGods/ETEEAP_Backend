require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());

// Allow all origins temporarily for debugging (CORS)
app.use(
  cors({
    origin: true, // Will reflect the request origin
    credentials: true,
    exposedHeaders: ["set-cookie"],
  })
);

// Static files (optional)
app.use(express.static(path.join(__dirname, "frontend")));

// Routes
const routes = require("./routes");
const applicants = require("./routes/applicantRoutes");
const admins = require("./routes/adminRoutes");
const assessors = require("./routes/assessorRoutes");
const authRoutes = require("./routes/authRoutes");

app.use("/", routes);
app.use("/applicants", applicants);
app.use("/admins", admins);
app.use("/assessors", assessors);
app.use("/api", authRoutes);

// Health check
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend working!" });
});

// Catch root path (optional)
app.get("/", (req, res) => {
  res.send("ETEEAP Backend Root Route");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// MongoDB Connection and Server Start
const PORT = process.env.PORT || 5000;

const connectDB = require("./config/db");

(async () => {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
})();
