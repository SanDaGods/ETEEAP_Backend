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

// ✅ Frontend URL fallback (used by CORS)
const FRONTEND_URL = process.env.FRONTEND_URL || "https://eteeap-domain-uluo.vercel.app";

// ✅ Connect to MongoDB
const connectDB = require("./config/db");
connectDB();

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());

// ✅ CORS setup (important for frontend interaction)
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    exposedHeaders: ["set-cookie"],
  })
);

// ✅ Static file serving (optional, remove if not used)
app.use(express.static(path.join(__dirname, "frontend")));

// ✅ Routes
const routes = require("./routes");
const applicants = require("./routes/applicantRoutes");
const admins = require("./routes/adminRoutes");
const assessors = require("./routes/assessorRoutes");

app.use("/", routes);
app.use("/applicants", applicants);
app.use("/admins", admins);
app.use("/assessors", assessors);

// ✅ Health check / test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend working!" });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ✅ Start server with dynamic port (important for Railway)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
