const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return res.status(401).json({ message: "Authentication required" });
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_ACCESS_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admins only" });
  next();
};

module.exports = { protect, adminOnly };
