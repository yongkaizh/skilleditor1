import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function callAI(provider, apiKey, prompt) {
    if (provider === 'openai') {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey });
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }]
        });
        return response.choices[0].message.content;
    } else {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return result.text;
    }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.post("/api/log-error", (req, res) => { fs.appendFileSync("browser_errors.log", JSON.stringify(req.body) + "\n"); console.error("BROWSER ERROR:", req.body); res.send("ok"); });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/expert/analyze", async (req, res) => {
    const { code, error, context, apiKey, provider = 'gemini' } = req.body;
    
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
      const text = await callAI(provider, apiKey, prompt);
      res.json({ analysis: text });
    } catch (err) {
      console.error("Expert Analysis Error:", err);
      res.status(500).json({ error: "Failed to get expert analysis: " + err.message });
    }
  });

  app.post("/api/expert/chat", async (req, res) => {
    const { code, question, apiKey, provider = 'gemini' } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: "API Key is required. Please set it in Settings." });
    }

    const prompt = `
      You are a Cadence SKILL Expert Agent integrated directly into an in-browser IDE.
      The user is asking a question or requesting a change to their SKILL code.
      
      Current Code in Editor:
      \`\`\`cadence-skill
      ${code}
      \`\`\`
      
      User Request: "${question}"
      
      You can reply with advice, AND you can optionally return an entirely modified version of the code.
      You MUST output a valid JSON response with the following schema:
      {
        "reply": "Your explanation or advice to the user. Keep it concise.",
        "newCode": "The full updated code if the user requested changes. If no changes were requested, or if you are just answering a question, leave this as null."
      }
      
      Ensure your response is ONLY valid JSON, do not include markdown codeblocks around the JSON.
    `;

    try {
      let text = await callAI(provider, apiKey, prompt);
      text = text.replace(/^\`\`\`json/m, '').replace(/\`\`\`$/m, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        // Fallback if AI didn't output JSON properly
        parsed = { reply: text, newCode: null };
      }
      res.json(parsed);
    } catch (err) {
      console.error("Expert Chat Error:", err);
      res.status(500).json({ error: "Failed to get AI response: " + err.message });
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
