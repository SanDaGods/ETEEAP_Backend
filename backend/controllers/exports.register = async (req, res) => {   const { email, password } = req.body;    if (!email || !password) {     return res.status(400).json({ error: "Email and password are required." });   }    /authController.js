exports.register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  // Simulate success response
  return res.status(201).json({
    message: "Registration successful",
    data: {
      userId: "mockUserId123",
      applicantId: "mockApplicantId456",
      email,
    },
  });
};
