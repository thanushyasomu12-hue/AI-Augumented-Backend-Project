const router = require("express").Router();
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const c = require("../controllers/materialController");

router.use(protect);
router.get("/dashboard", c.getDashboard);
router.post("/upload", upload.single("file"), c.uploadMaterial);
router.get("/", c.getMaterials);
router.get("/:id", c.getMaterial);
router.patch("/:id", c.updateMaterial);
router.delete("/:id", c.deleteMaterial);
router.post("/:id/summarize", c.summarize);
router.post("/:id/flashcards", c.generateFlashcards);
router.post("/:id/quiz", c.generateQuiz);
router.post("/:id/study-plan", c.generateStudyPlan);
module.exports = router;
