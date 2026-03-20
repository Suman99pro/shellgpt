#!/usr/bin/env node
"use strict";

const https = require("https");
const readline = require("readline");

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

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
  white: "\x1b[97m",
  bgDark: "\x1b[40m",
};

function c(color, text) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function openaiRequest(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: MODEL, temperature: 0.2, messages });
    const options = {
      hostname: "api.openai.com",
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(parsed.error.message));
          else resolve(parsed);
        } catch {
          reject(new Error("Failed to parse OpenAI response"));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function printBanner() {
  console.log("\n" + c("cyan", "╔═══════════════════════════════════╗"));
  console.log(c("cyan", "║") + c("bold", "   ⚡ ShellGPT — NL → Shell CLI    ") + c("cyan", "║"));
  console.log(c("cyan", "╚═══════════════════════════════════╝"));
  console.log(c("gray", "  Type your request in plain English."));
  console.log(c("gray", "  Type 'exit' or Ctrl+C to quit.\n"));
}

function printResult(result) {
  console.log("\n" + c("green", "┌─ Command ─────────────────────────────────────────"));
  console.log(c("green", "│ ") + c("bold", c("white", result.command)));
  console.log(c("green", "└───────────────────────────────────────────────────"));
  console.log(c("gray", "  ℹ  ") + result.explanation);
  if (result.os) {
    console.log(c("gray", "  🖥  OS: ") + c("cyan", result.os));
  }
  if (result.warnings && result.warnings !== "null") {
    console.log(c("yellow", "\n  ⚠  Warning: ") + result.warnings);
  }
  console.log();
}

async function runOnce(prompt) {
  if (!OPENAI_API_KEY) {
    console.error(c("red", "Error: OPENAI_API_KEY environment variable not set."));
    process.exit(1);
  }
  process.stdout.write(c("gray", "  Generating..."));
  try {
    const data = await openaiRequest([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ]);
    process.stdout.write("\r" + " ".repeat(20) + "\r");
    const raw = data.choices[0].message.content.trim();
    printResult(JSON.parse(raw));
  } catch (err) {
    process.stdout.write("\r");
    console.error(c("red", `  Error: ${err.message}`));
    process.exit(1);
  }
}

async function runInteractive() {
  printBanner();
  if (!OPENAI_API_KEY) {
    console.error(c("red", "Error: OPENAI_API_KEY environment variable not set.\n"));
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = () => {
    rl.question(c("cyan", "shellgpt> ") + c("white", ""), async (input) => {
      const prompt = input.trim();
      if (!prompt || prompt === "") return ask();
      if (prompt === "exit" || prompt === "quit") {
        console.log(c("gray", "\n  Goodbye!\n"));
        rl.close();
        return;
      }
      process.stdout.write(c("gray", "  ⏳ Thinking...\n"));
      try {
        const data = await openaiRequest([
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ]);
        const raw = data.choices[0].message.content.trim();
        printResult(JSON.parse(raw));
      } catch (err) {
        console.error(c("red", `  Error: ${err.message}\n`));
      }
      ask();
    });
  };
  ask();
}

// Entry point
const args = process.argv.slice(2);
if (args.length > 0) {
  runOnce(args.join(" "));
} else {
  runInteractive();
}
