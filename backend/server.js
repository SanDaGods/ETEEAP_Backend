require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { GridFSBucket, ObjectId } = require("mongodb");

const app = express();

// ✅ Import config and routes
const connectDB = require("./config/db");
const routes = require("./routes");
const applicants = require("./routes/applicantRoutes");
const admins = require("./routes/adminRoutes");
const assessors = require("./routes/assessorRoutes");

// ✅ Connect to MongoDB
connectDB();

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());

// ✅ Use CORS with environment variable for frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    exposedHeaders: ["set-cookie"],
  })
);

// ✅ Optional: serve static files (only if needed)
app.use(express.static(path.join(__dirname, "frontend")));

// ✅ Routes
app.use("/", routes, applicants, assessors, admins);

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ✅ Start Server with dynamic port (important for Railway)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});
