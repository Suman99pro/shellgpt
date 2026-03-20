# ⚡ ShellGPT

Natural language → Shell command generator. Web UI + CLI, Docker-ready.

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
docker compose up -d
# Open http://localhost:3000
```

## CLI Usage

```bash
# One-shot mode
OPENAI_API_KEY=sk-... node cli/shellgpt.js find all log files older than 30 days

# Interactive REPL
OPENAI_API_KEY=sk-... node cli/shellgpt.js
```

## Manual (no Docker)

```bash
npm install
OPENAI_API_KEY=sk-... npm start
```

## Project Structure

```
shellgpt/
├── server.js          # Express API server
├── public/
│   └── index.html     # Web UI
├── cli/
│   └── shellgpt.js    # CLI tool (Node, zero deps)
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## API

`POST /api/generate`
```json
{ "prompt": "kill the process using port 3000" }
```
Response:
```json
{
  "command": "fuser -k 3000/tcp",
  "explanation": "Kills any process listening on TCP port 3000.",
  "warnings": "This immediately kills the process without confirmation.",
  "os": "linux"
}
```
