const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const multer = require("multer");
const { GridFSBucket, ObjectId } = require("mongodb");

const { JWT_SECRET } = require("../config/constants");
const upload = require("../middleware/fileUpload");
const { getNextApplicantId } = require("../utils/helpers");
const Applicant = require("../models/Applicant");

const conn = mongoose.connection;
let gfs;
conn.once("open", () => {
  gfs = new GridFSBucket(conn.db, { bucketName: "backupFiles" });
});

// Register
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const existing = await Applicant.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const applicantId = await getNextApplicantId();

    const newApplicant = new Applicant({
      email,
      password: hashedPassword,
      applicantId,
    });

    await newApplicant.save();

    res.status(201).json({
      message: "Registration successful",
      data: {
        userId: newApplicant._id,
        applicantId: newApplicant.applicantId,
        email: newApplicant.email,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const applicant = await Applicant.findOne({ email });
    if (!applicant) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, applicant.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: applicant._id, role: "applicant" }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("applicantToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(200).json({
      message: "Login successful",
      data: {
        userId: applicant._id,
        email: applicant.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed", details: err.message });
  }
};

// Update personal info
exports.updateInfo = async (req, res) => {
  try {
    const userId = req.body.userId;
    let personalInfo = req.body.personalInfo;

    if (typeof personalInfo === "string") {
      personalInfo = JSON.parse(personalInfo);
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    const updated = await Applicant.findByIdAndUpdate(
      userId,
      { personalInfo, updatedAt: new Date() },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "User not found" });

    res.json({
      message: "Personal information updated",
      data: updated,
    });
  } catch (err) {
    console.error("Update info error:", err);
    res.status(500).json({ error: "Failed to update personal info", details: err.message });
  }
};

// File submission
exports.fileSubmit = async (req, res) => {
  try {
    const userId = req.body.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const uploadResults = await Promise.all(
      req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const readStream = fs.createReadStream(file.path);
          const uploadStream = gfs.openUploadStream(file.originalname, {
            contentType: file.mimetype,
            metadata: {
              uploadDate: new Date(),
              originalName: file.originalname,
              size: file.size,
              owner: userId,
            },
          });

          uploadStream.on("finish", () => {
            fs.unlinkSync(file.path);
            resolve({
              fileId: uploadStream.id,
              filename: file.originalname,
              contentType: file.mimetype,
            });
          });

          uploadStream.on("error", reject);
          readStream.pipe(uploadStream);
        });
      })
    );

    res.json({ message: "Files uploaded", files: uploadResults });
  } catch (err) {
    console.error("File upload error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
};

// File fetch
exports.fileFetch = async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    const files = await conn.db
      .collection("backupFiles.files")
      .find({ "metadata.owner": userId })
      .toArray();

    res.json({ files });
  } catch (err) {
    console.error("Fetch files error:", err);
    res.status(500).json({ error: "Could not fetch files", details: err.message });
  }
};

// Auth status
exports.authStatus = async (req, res) => {
  try {
    const token = req.cookies.applicantToken;
    if (!token) return res.json({ authenticated: false });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await Applicant.findById(decoded.userId);
    if (!user) return res.json({ authenticated: false });

    res.json({ authenticated: true, user });
  } catch {
    res.json({ authenticated: false });
  }
};

// Logout
exports.logout = (req, res) => {
  res.clearCookie("applicantToken");
  res.json({ message: "Logged out successfully" });
};
