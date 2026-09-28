const mongoose = require("mongoose");

const flashcardSchema = new mongoose.Schema({ question: String, answer: String }, { _id: false });
const quizSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String,
  explanation: String
}, { _id: false });

const materialSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true },
  filename: String,
  fileType: { type: String, enum: ["txt", "md", "pdf"], default: "txt" },
  summary: String,
  flashcards: [flashcardSchema],
  quiz: [quizSchema],
  studyPlan: String,
  tags: [{ type: String, trim: true, lowercase: true }],
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  favorite: { type: Boolean, default: false },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  lastStudiedAt: Date
}, { timestamps: true });

materialSchema.index({ title: "text", tags: "text" });

module.exports = mongoose.model("Material", materialSchema);
