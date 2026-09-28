require("dotenv").config();
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const connectDB = require("./src/utils/db");

const app = express();
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.disable("x-powered-by");
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => res.json({
  name: "AI StudyBuddy API",
  version: "2.0.0",
  status: "running",
  docs: "/api/health"
}));

app.get("/api/health", (req, res) => res.json({
  status: "ok",
  service: "ai-studybuddy",
  timestamp: new Date().toISOString()
}));

app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/materials", require("./src/routes/materials"));
app.use("/api/admin", require("./src/routes/admin"));

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || (err.name === "MulterError" ? 400 : 500);
  res.status(status).json({ message: err.message || "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`AI StudyBuddy API running on http://localhost:${PORT}`));
  }).catch((err) => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });
}

module.exports = app;
