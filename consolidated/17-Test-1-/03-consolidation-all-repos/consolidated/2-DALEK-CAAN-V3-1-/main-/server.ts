import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy for GitHub
  app.post("/api/github/proxy", async (req, res) => {
    const { url, method, body, headers: clientHeaders } = req.body;
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return res.status(500).json({ error: "GITHUB_TOKEN missing on server" });
    }

    try {
      const response = await fetch(url, {
        method: method || "GET",
        headers: {
          ...clientHeaders,
          "Authorization": `token ${token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Proxy for Cerebras
  app.post("/api/cerebras/proxy", async (req, res) => {
    const { messages, model } = req.body;
    const key = process.env.CEREBRAS_API_KEY;

    if (!key) {
      return res.status(500).json({ error: "CEREBRAS_API_KEY missing on server" });
    }

    try {
      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: model || "llama3.1-8b",
          messages,
        }),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Proxy for Grok
  app.post("/api/grok/proxy", async (req, res) => {
    const { messages, model } = req.body;
    const key = process.env.GROK_API_KEY;

    if (!key) {
      return res.status(500).json({ error: "GROK_API_KEY missing on server" });
    }

    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: model || "grok-beta",
          messages,
        }),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
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
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
