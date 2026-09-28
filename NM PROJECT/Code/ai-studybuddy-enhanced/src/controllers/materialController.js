const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mongoose = require("mongoose");
const Material = require("../models/Material");
const { askGemini, parseJsonResponse } = require("../utils/gemini");

const ensureOwner = async (id, user) => {
  if (!mongoose.isValidObjectId(id)) return null;
  const material = await Material.findById(id);
  if (!material) return null;
  if (user.role !== "admin" && material.user.toString() !== user.userId) {
    const err = new Error("Access denied"); err.status = 403; throw err;
  }
  return material;
};

const extractText = async (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".pdf") {
    const buffer = fs.readFileSync(file.path);
    const data = await pdfParse(buffer);
    return data.text.trim();
  }
  return fs.readFileSync(file.path, "utf8").trim();
};

const uploadMaterial = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  try {
    const content = await extractText(req.file);
    if (!content) return res.status(400).json({ message: "The uploaded file contains no readable text" });
    const tags = String(req.body.tags || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean).slice(0, 10);
    const material = await Material.create({
      user: req.user.userId,
      title: req.body.title?.trim() || req.file.originalname,
      content,
      filename: req.file.originalname,
      fileType: path.extname(req.file.originalname).slice(1).toLowerCase(),
      tags
    });
    res.status(201).json({ message: "Material uploaded", material: { ...material.toObject(), content: undefined } });
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }
};

const getMaterials = async (req, res) => {
  const { search, favorite, difficulty, tag } = req.query;
  const filter = req.user.role === "admin" ? {} : { user: req.user.userId };
  if (search) filter.$text = { $search: search };
  if (favorite === "true") filter.favorite = true;
  if (["easy", "medium", "hard"].includes(difficulty)) filter.difficulty = difficulty;
  if (tag) filter.tags = String(tag).toLowerCase();
  const materials = await Material.find(filter).select("-content -flashcards -quiz -studyPlan").sort("-updatedAt");
  res.json(materials);
};

const getMaterial = async (req, res) => {
  const material = await ensureOwner(req.params.id, req.user);
  if (!material) return res.status(404).json({ message: "Material not found" });
  res.json(material);
};

const deleteMaterial = async (req, res) => {
  const material = await ensureOwner(req.params.id, req.user);
  if (!material) return res.status(404).json({ message: "Material not found" });
  await material.deleteOne();
  res.json({ message: "Material deleted" });
};

const updateMaterial = async (req, res) => {
  const material = await ensureOwner(req.params.id, req.user);
  if (!material) return res.status(404).json({ message: "Material not found" });
  const allowed = ["title", "favorite", "difficulty", "progress", "tags"];
  for (const key of allowed) if (req.body[key] !== undefined) material[key] = req.body[key];
  if (req.body.progress !== undefined) {
    const p = Number(req.body.progress);
    if (!Number.isFinite(p) || p < 0 || p > 100) return res.status(400).json({ message: "Progress must be between 0 and 100" });
    material.progress = p;
    material.lastStudiedAt = new Date();
  }
  await material.save();
  res.json({ message: "Material updated", material });
};

const summarize = async (req, res) => {
  const material = await ensureOwner(req.params.id, req.user);
  if (!material) return res.status(404).json({ message: "Material not found" });
  const summary = await askGemini(`Summarize this study material for a college student. Use headings and concise bullet points. Preserve important definitions, formulas and examples.\n\n${material.content}`);
  material.summary = summary; await material.save(); res.json({ summary });
};

const generateFlashcards = async (req, res) => {
  const material = await ensureOwner(req.params.id, req.user);
  if (!material) return res.status(404).json({ message: "Material not found" });
  const count = Math.min(Math.max(Number(req.body.count) || 5, 1), 20);
  const raw = await askGemini(`Create exactly ${count} useful flashcards from this study material. Return ONLY JSON array: [{"question":"...","answer":"..."}].\n\n${material.content}`);
  const flashcards = parseJsonResponse(raw); material.flashcards = flashcards; await material.save(); res.json({ flashcards });
};

const generateQuiz = async (req, res) => {
  const material = await ensureOwner(req.params.id, req.user);
  if (!material) return res.status(404).json({ message: "Material not found" });
  const count = Math.min(Math.max(Number(req.body.count) || 5, 1), 20);
  const raw = await askGemini(`Create exactly ${count} MCQ questions from this study material. Return ONLY JSON array: [{"question":"...","options":["A","B","C","D"],"answer":"A","explanation":"..."}].\n\n${material.content}`);
  const quiz = parseJsonResponse(raw); material.quiz = quiz; await material.save(); res.json({ quiz });
};

const generateStudyPlan = async (req, res) => {
  const material = await ensureOwner(req.params.id, req.user);
  if (!material) return res.status(404).json({ message: "Material not found" });
  const days = Math.min(Math.max(Number(req.body.days) || 7, 1), 30);
  const hours = Math.min(Math.max(Number(req.body.hoursPerDay) || 2, 0.5), 12);
  const goal = req.body.goal || "Understand and retain the material";
  const studyPlan = await askGemini(`Create a practical ${days}-day study plan. Goal: ${goal}. Time: ${hours} hours/day. Include daily topics, active recall, practice and revision.\n\nMaterial:\n${material.content}`);
  material.studyPlan = studyPlan; await material.save(); res.json({ studyPlan });
};

const getDashboard = async (req, res) => {
  const filter = { user: req.user.userId };
  const [total, completed, favorites, inProgress] = await Promise.all([
    Material.countDocuments(filter), Material.countDocuments({ ...filter, progress: 100 }),
    Material.countDocuments({ ...filter, favorite: true }), Material.countDocuments({ ...filter, progress: { $gt: 0, $lt: 100 } })
  ]);
  const avg = await Material.aggregate([{ $match: filter }, { $group: { _id: null, avgProgress: { $avg: "$progress" } } }]);
  res.json({ totalMaterials: total, completedMaterials: completed, favoriteMaterials: favorites, inProgressMaterials: inProgress, averageProgress: Math.round(avg[0]?.avgProgress || 0) });
};

module.exports = { uploadMaterial, getMaterials, getMaterial, deleteMaterial, updateMaterial, summarize, generateFlashcards, generateQuiz, generateStudyPlan, getDashboard };
