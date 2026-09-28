const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateTokens } = require("../utils/tokens");
const bcrypt = require("bcryptjs");

const safeUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, preferences: u.preferences });

const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "name, email and password are required" });
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: "Email already in use" });
  // Public registration always creates a student; admin accounts should be created manually in the DB.
  const user = await User.create({ name, email: normalizedEmail, password, role: "student" });
  const tokens = generateTokens(user._id, user.role);
  res.status(201).json({ message: "Registered successfully", ...tokens, user: safeUser(user) });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: String(email || "").trim().toLowerCase()
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(
      String(password || ""),
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const tokens = generateTokens(user._id, user.role);

    return res.status(200).json({
      message: "Login successful",
      ...tokens,
      user: safeUser(user)
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: error.message
    });
  }
};

const refresh = async (req, res) => {

  const token = req.headers["x-refresh-token"];

  if (!token) {
    return res.status(401).json({
      message: "Refresh token required"
    });
  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET
    );

    const tokens = generateTokens(
      decoded.userId,
      decoded.role
    );

    res.json({
      message: "Tokens refreshed",
      ...tokens
    });

  } catch {

    res.status(401).json({
      message: "Invalid refresh token"
    });

  }
};

const logout = (req, res) => res.json({ message: "Logged out. Discard the access and refresh tokens on the client." });

module.exports = { register, login, refresh, logout };
