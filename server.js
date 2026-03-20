const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-4o";

const SYSTEM_PROMPT = `You are ShellGPT — an expert Linux/DevOps shell command generator.
Given a plain-English description, respond ONLY with a JSON object in this exact format:
{
  "command": "<the shell command>",
  "explanation": "<one concise sentence explaining what it does>",
  "warnings": "<any gotchas or destructive risks, or null if none>",
  "os": "<linux|macos|both>"
}
No markdown, no extra text. Only valid JSON.`;

async function generateCommand(prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "OpenAI API error");
  }

  const data = await res.json();
  const raw = data.choices[0].message.content.trim();
  return JSON.parse(raw);
}

app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
    return res.status(400).json({ error: "Prompt is required." });
  }
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY not set." });
  }
  try {
    const result = await generateCommand(prompt.trim());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (_, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ShellGPT running on http://localhost:${PORT}`));
