require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());

// CORS (make sure this value is a valid URL in .env)
const allowedOrigin = process.env.FRONTEND_URL;

if (!allowedOrigin) {
  console.error("❌ FRONTEND_URL is missing in .env");
  process.exit(1);
}

app.use(
  cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  exposedHeaders: ["set-cookie"],
});
);

// Optional: Static files (for production frontend serving)
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

app.get("/", (req, res) => {
  res.send("ETEEAP Backend Root Route");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Connect to DB and start server
const PORT = process.env.PORT || 5000;
const connectDB = require("./config/db");

(async () => {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();
