# CodeProof

Security-first code scanning with actionable AI-assisted analysis, local CLI enforcement, and a live dashboard.

---

## ✨ What is CodeProof?

CodeProof is a multi-part platform that helps teams catch risky patterns before code lands in production.

It combines:
- **CLI scanning** for staged or full-repo checks
- **Pre-commit enforcement** for policy guardrails
- **Server-side report ingestion** with project/report APIs
- **Dashboard UI** for visibility and trends
- **AI risk API** for contextual risk escalation

---

## 🧱 Monorepo Structure

```text
Code_proof/
├─ cli/         # Node.js CLI (scan, report, enforcement controls)
├─ server/      # Express + TypeScript backend (reports/projects/auth)
├─ dashboard/   # Next.js dashboard frontend
├─ AI/          # FastAPI risk classification microservice
└─ codeproof.config.json
```

---

## 🚀 Quick Start (Local Dev)

### 1) Prerequisites

- **Node.js 18+**
- **npm**
- **Python 3.10+** (for `AI/`)
- **MongoDB** running locally or remotely

### 2) Install dependencies

```bash
# CLI
cd cli
npm install

# Server
cd ../server
npm install

# Dashboard
cd ../dashboard
npm install

# AI service (Python)
cd ../AI
pip install -r requirements.txt
```

### 3) Configure environment

#### `server/.env`

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/codeproof
JWT_SECRET=replace-with-strong-secret

# Optional
REQUEST_BODY_LIMIT=2mb
REQUEST_TIMEOUT_MS=15000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60
ENABLE_AUTH=true
ENABLE_RATE_LIMITING=true
ENABLE_PUBLIC_REPORTS=true
```

#### `dashboard/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 4) Run services

```bash
# Terminal 1 - Backend API
cd server
npm run dev

# Terminal 2 - Dashboard
cd dashboard
npm run dev

# Terminal 3 - AI Risk API
cd AI
python main.py
```

Dashboard default URL: `http://localhost:3000`

---

## 🛠 CLI Usage

From `cli/`, expose the CLI locally:

```bash
cd cli
npm link
```

Now use it in any Git repo:

```bash
codeproof init
codeproof run
codeproof report@dashboard
codeproof move-secret
codeproof ignore
codeproof apply
codeproof whoami
```

### Command Summary

- `init` – initialize CodeProof config + install pre-commit hook
- `run` – execute scanner and generate report
- `report@dashboard` – sync latest report + show dashboard project link
- `move-secret` – move high-confidence secrets to `.env`
- `ignore` / `apply` – disable or re-enable commit enforcement
- `whoami` – show local CodeProof client identity

---

## ⚙️ Configuration (`codeproof.config.json`)

Core options:
- `scanMode`: `staged` or `full`
- `enforcement`: `enabled` or `disabled`
- `features.reporting`: local/server report pipeline
- `features.integration`: report sync to backend endpoint
- `features.aiEscalation`: send ambiguous findings for AI analysis
- `integration.endpointUrl`: report ingestion endpoint (example: `http://localhost:4000/api/reports`)

---

## 🔍 How Scanning Works

1. File targets are selected (`staged` or `full` mode)
2. Rules engine runs deterministic checks (secrets, risky usage, insecure config, etc.)
3. Optional AI escalation reviews ambiguous findings
4. Decisions are merged into **block** and **warn** outcomes
5. Reports are written locally and optionally synced to server
6. Exit code controls commit blocking in pre-commit flow

---

## 🌐 APIs (Server)

- `POST /api/reports` – ingest report
- `GET /api/reports/:reportId` – fetch a report
- `POST /api/auth/login` – auth endpoint
- `GET /api/projects*` – project dashboard APIs (auth-protected)

---

## 🤖 AI Risk Service

The `AI/` microservice exposes:
- `POST /predict` – plain text body, returns risk verdict (`Critical`, `High Risk`, `No Risk`)

Run with:

```bash
cd AI
python main.py
```

Default bind: `127.0.0.1:8000`

---

## 📦 Build Scripts

### `server/`

```bash
npm run dev
npm run build
npm run start
```

### `dashboard/`

```bash
npm run dev
npm run build
npm run start
npm run lint
```

---

## 📌 Roadmap Ideas

- GitHub App / CI integrations
- Multi-repo organization analytics
- Richer secret remediation workflows
- Policy packs for compliance standards

---

## 🤝 Contributing

1. Fork and clone
2. Create a feature branch
3. Make focused changes
4. Run local checks
5. Open a PR with clear context

---

## 📄 License

MIT (see package-level declarations)
