const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const { JWT_SECRET } = require("../config/constants");
const upload = require("../middleware/fileUpload");
const { getNextApplicantId } = require("../utils/helpers");
const Applicant = require("../models/Applicant");
const mongoose = require("mongoose");
const conn = mongoose.connection;
const multer = require("multer");
const { GridFSBucket, ObjectId } = require("mongodb");

let gfs;
conn.once("open", () => {
  gfs = new GridFSBucket(conn.db, {
    bucketName: "backupFiles",
  });
});

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
        details: `Please enter a valid email address (e.g., user@example.com). Provided: ${email}`,
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password too short",
        details: "Password must be at least 8 characters",
      });
    }

    const existingUser = await Applicant.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const applicantId = await getNextApplicantId();

    const newApplicant = new Applicant({
      email: email.toLowerCase(),
      password: hashedPassword,
      applicantId,
    });

    await newApplicant.save();

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        userId: newApplicant._id,
        applicantId: newApplicant.applicantId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Registration failed",
      details: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const applicant = await Applicant.findOne({ email });

    if (!applicant || !(await bcrypt.compare(password, applicant.password))) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const token = jwt.sign({
      userId: applicant._id,
      role: "applicant",
      email: applicant.email,
    }, JWT_SECRET, { expiresIn: "1h" });

    res.cookie("applicantToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        userId: applicant._id,
        email: applicant.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Login failed" });
  }
};

exports.fileFetch = async (req, res) => {
  try {
    const userId = req.body.userId;
    const fileId = new ObjectId(req.params.id);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: "Invalid userId format" });
    }

    const files = await conn.db.collection("backupFiles.files").find({
      _id: fileId,
      "metadata.owner": userId,
    }).toArray();

    if (!files.length) {
      return res.status(404).json({ error: "File not found" });
    }

    const file = files[0];
    res.set("Content-Type", file.contentType);
    res.set("Content-Disposition", `inline; filename="${file.filename}"`);

    const downloadStream = gfs.openDownloadStream(fileId);
    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: "Failed to serve file" });
  }
};

exports.fileDelete = async (req, res) => {
  try {
    const fileId = new ObjectId(req.params.id);
    await gfs.delete(fileId);
    res.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete file" });
  }
};

exports.fileSubmit = async (req, res) => {
  try {
    const userId = req.body.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: "Invalid userId format" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: "No files uploaded" });
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
              label: "initial-submission",
              owner: userId,
            },
          });

          uploadStream.on("error", (err) => {
            fs.unlinkSync(file.path);
            reject(err);
          });

          uploadStream.on("finish", () => {
            fs.unlinkSync(file.path);
            resolve({
              fileId: uploadStream.id,
              filename: file.originalname,
              size: file.size,
              contentType: file.mimetype,
            });
          });

          readStream.pipe(uploadStream);
        });
      })
    );

    res.json({
      success: true,
      message: `${uploadResults.length} files uploaded successfully`,
      files: uploadResults,
    });
  } catch (error) {
    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    res.status(500).json({ success: false, error: "File upload failed", details: error.message });
  }
};
