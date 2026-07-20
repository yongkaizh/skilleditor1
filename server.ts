import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/expert/analyze", async (req, res) => {
    const { code, error, context, apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: "API Key is required. Please set it in Settings." });
    }

    const prompt = `
      You are a Cadence SKILL Expert. A user is working in a SKILL IDE and encountered the following error:
      
      Error: ${error}
      
      Code Snippet:
      \`\`\`cadence-skill
      ${code}
      \`\`\`
      
      Context: ${context || "No additional context provided."}
      
      Please provide a concise explanation of what the error means in the context of Cadence Virtuoso / SKILL, and suggest a fix. 
      Keep the response brief and professional (suitable for a terminal/console window).
      Use markdown for code snippets.
    `;

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      res.json({ analysis: result.text });
    } catch (err: any) {
      console.error("Expert Analysis Error:", err);
      res.status(500).json({ error: "Failed to get expert analysis: " + err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
