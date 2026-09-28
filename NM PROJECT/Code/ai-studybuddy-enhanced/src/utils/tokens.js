const jwt = require("jsonwebtoken");

const generateTokens = (userId, role) => {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT secrets are missing in .env");
  }
  const payload = { userId: userId.toString(), role };
  return {
    accessToken: jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" }),
    refreshToken: jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" })
  };
};

module.exports = { generateTokens };
