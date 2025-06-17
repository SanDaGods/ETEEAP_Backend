exports.register = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    return res.status(201).json({
      message: "Registration successful",
      data: {
        userId: "mockUserId123",
        applicantId: "mockApplicantId456",
        email,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ success: false, error: "Internal error", message: err.message });
  }
};
