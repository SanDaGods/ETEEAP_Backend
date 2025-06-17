const express = require("express");
const router = express.Router();

// Basic API root health check
router.get("/ping", (req, res) => {
  res.json({ success: true, message: "API root is working." });
});

// Optional test endpoint
router.get("/test", (req, res) => {
  res.json({ message: "Backend working!" });
});

// If you still want to support serving PDFs (optional)
const path = require("path");
const fs = require("fs");

router.get("/documents/:filename", (req, res) => {
  const filename = req.params.filename;

  if (
    !filename.endsWith(".pdf") ||
    !/^[a-zA-Z0-9_\-\.]+\.pdf$/.test(filename)
  ) {
    return res.status(400).json({ error: "Only PDF files are supported" });
  }

  const filePath = path.join(__dirname, "../public/documents", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.sendFile(filePath);
});

module.exports = router;
