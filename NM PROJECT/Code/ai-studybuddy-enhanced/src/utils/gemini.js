const { GoogleGenerativeAI } = require("@google/generative-ai");

let model;
const getModel = () => {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing in .env");
  if (!model) {
   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

model = genAI.getGenerativeModel({
  model: "gemini-3.8-flash"
});

console.log("GEMINI MODEL: gemini-3.8-flash");
  }
  return model;
};

const askGemini = async (prompt) => {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await getModel().generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error(`Gemini attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries) {
        throw error;
      }

      // Wait: 2s, 4s, 8s
      const delay = 2000 * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const parseJsonResponse = (raw) => {
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  const start = Math.min(...[cleaned.indexOf("["), cleaned.indexOf("{")].filter(i => i >= 0));
  const end = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));
  if (start < 0 || end < start) throw new Error("AI returned an invalid JSON response");
  return JSON.parse(cleaned.slice(start, end + 1));
};

module.exports = { askGemini, parseJsonResponse };
