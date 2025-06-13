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
const conn = mongoose.connection;

const app = express();

const connectDB = require("./config/db");
const { PORT } = require("./config/constants");
const routes = require("./routes");
const applicants = require("./routes/applicantRoutes");
const admins = require("./routes/adminRoutes");
const assessors = require("./routes/assessorRoutes");

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());

// CORS Setup
const allowedOrigins = [
  "https://eteeap-domain-uluo.vercel.app",  // ✅ your production frontend
  "http://localhost:3000"                   // ✅ for local development
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    exposedHeaders: ["set-cookie"],
  })
);

// Serve static files (optional depending on your setup)
app.use(express.static(path.join(__dirname, "frontend")));

// Connect to MongoDB
connectDB();

// Routes
app.use("/", routes, applicants, assessors, admins);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});
