# UdyamSetu AI — National Rural Micro-Enterprise Advisory & Financial Structuring Platform

> **AI-Driven Hyper-Local Business Advisory and Financial Structuring Assistant for Rural Micro-Entrepreneurs**  
> Under Ministry of Social Justice & Empowerment (MoSJE), Government of India.

---

## 📌 Overview

**UdyamSetu AI** is a comprehensive, production-grade decision support platform designed to empower rural micro-entrepreneurs, smallholders, and rural women self-help groups. It combines:

1. **Multilingual Conversational AI & Interviewer:** Voice & text support across Hindi, English, and Telugu with speech-to-text (STT) and voice speech synthesis (TTS). Proactively asks for required details to auto-populate registration dossiers in real-time.
2. **Hyper-Local GIS Market Engine:** Haversine distance calculations, 5–15 km catchment radius analysis, competitor density mapping, and demand-supply gap indexing.
3. **MoSJE Concessional Financial Engine:** Automated capital structuring following standard concessional guidelines (10% entrepreneur margin, 90% loan via NBCFDC/NSFDC/Mudra), reducing balance EMI schedules, and Debt Service Coverage Ratio (DSCR) calculations.
4. **Deterministic Scheme Rule Engine:** Direct eligibility checks against official MoSJE, PMEGP, Mudra, and PM Vishwakarma scheme rules.
5. **7-Axis Risk & Stress-Testing Simulator:** Live economic shock simulation (-20% revenue, +15% input expenses) with real-time recalculation of cash flow and debt viability.

---

## 🏗️ System Architecture

The application is structured into three decoupled, high-performance tiers:

```
┌─────────────────────────────────────────────────────────────┐
│             Frontend UI (Port 3000)                         │
│   React 18 + Vite + Tailwind CSS + Lucide Icons + Leaflet   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
┌──────────────────────────────▼──────────────────────────────┐
│        Backend Orchestrator (Port 5000)                     │
│   Node.js + Express + NLU Pipeline + Session State          │
└──────────────────────────────┬──────────────────────────────┘
                               │ Internal API (REST)
┌──────────────────────────────▼──────────────────────────────┐
│        AI Analytics Microservice (Port 8001)                 │
│   Python 3.10+ + FastAPI + Pydantic + NumPy + GIS + RAG     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide (For Collaborators)

### Prerequisites
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **Python**: v3.10 or higher ([Download Python](https://www.python.org/))
- **Git**: Installed and configured

---

### Step 1: Clone the Repository
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd sih26091
```

---

### Step 2: Start the AI Analytics Microservice (Python FastAPI)

Open Terminal 1:
```bash
cd ai-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the AI microservice on port 8001
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```
*Health Check:* Open `http://127.0.0.1:8001/health` in your browser.

---

### Step 3: Start the Backend Orchestrator (Node.js Express)

Open Terminal 2:
```bash
cd backend

# Install dependencies
npm install

# Start the backend server on port 5000
npm start
```
*Health Check:* Open `http://127.0.0.1:5000/health` in your browser.

---

### Step 4: Start the Frontend Application (React + Vite)

Open Terminal 3:
```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server on port 3000
npm run dev
```
*Open Application:* Open **`http://127.0.0.1:3000`** in your browser.

---

## 👥 How to Collaborate on this Project with Git

### 1. Daily Workflow
Always pull the latest changes before starting work:
```bash
git checkout master
git pull origin master
```

### 2. Working on Features (Using Branches)
Create a new branch for your feature or bug fix:
```bash
# Create and switch to a feature branch
git checkout -b feature/my-feature-name

# Make your changes, then stage and commit:
git add .
git commit -m "Add feature description"

# Push the branch to GitHub:
git push origin feature/my-feature-name
```

### 3. Merging Changes
1. Go to your GitHub repository in your browser.
2. Click **"Compare & pull request"**.
3. Review changes with your teammate and click **"Merge pull request"**.
4. Both collaborators pull the updated `master` branch:
```bash
git checkout master
git pull origin master
```

---

## 📁 Repository Directory Structure

```
sih26091/
├── ai-service/             # Python FastAPI Specialist Analytics Microservice
│   ├── app/
│   │   ├── explainability/ # Evidence chains in English, Hindi & Telugu
│   │   ├── finance_engine/ # 10/90 concessional loans, DSCR, reducing EMI
│   │   ├── market_engine/  # GIS Haversine catchment, competitor density
│   │   ├── nlu_engine/     # Multilingual intent parser & entity extractor
│   │   ├── rag_engine/     # Government scheme circular retriever
│   │   ├── recommendation/ # Multi-factor scoring & ranking pipeline
│   │   ├── risk_engine/    # 7-axis risk matrix & stress test simulator
│   │   ├── simulation/     # What-if scenario modeling
│   │   ├── config.py       # MoSJE parameters & weight thresholds
│   │   └── main.py         # FastAPI routes & endpoints
│   ├── requirements.txt    # Python package dependencies
│   └── test_engines.py     # Automated engine verification tests
├── backend/                # Node.js Express API & Orchestrator
│   ├── src/
│   │   ├── controllers/    # aiOrchestrator.js (handles chat, profile state)
│   │   └── routes/         # api.js route definitions
│   ├── package.json        # Backend npm dependencies
│   └── server.js           # Server entry point (port 5000)
├── frontend/               # React + Vite Client Application
│   ├── src/
│   │   ├── components/     # UI Views & Components:
│   │   │   ├── Navbar.jsx            # Top navigation, language & status
│   │   │   ├── ChatAssistant.jsx     # Voice STT/TTS & NLU Assistant
│   │   │   ├── ProfileWizard.jsx     # Dual-mode & AI guided interview
│   │   │   ├── MarketMapView.jsx     # Leaflet GIS catchment & live GPS
│   │   │   ├── FinanceDashboard.jsx  # 10/90 concessional split & cash flows
│   │   │   ├── SchemeMatcher.jsx     # MoSJE scheme rules & checklists
│   │   │   ├── RiskStressView.jsx    # 7-factor risk & economic shock slider
│   │   │   ├── SimulatorView.jsx     # Side-by-side What-If comparison
│   │   │   └── ReportView.jsx        # Printable executive dossier
│   │   ├── locales/        # translations.js (EN, HI, TE dictionaries)
│   │   ├── App.jsx         # Root app layout & active profile state
│   │   └── main.jsx        # React root mounting
│   ├── index.html          # HTML entry point with Leaflet styling
│   ├── package.json        # Frontend npm dependencies
│   └── vite.config.js      # Vite dev server configuration (port 3000)
├── data/                   # Verified Micro-Enterprise & Government Data
│   ├── business_catalog.json # 20+ vetted rural enterprise profiles
│   ├── competitors.json    # Geospatial competitor clusters
│   ├── schemes.json        # MoSJE, NBCFDC, NSFDC, Mudra scheme rules
│   └── villages.json       # Village coordinates & mandi benchmarks
├── database/               # Relational & PostGIS Schemas
│   ├── schema.sql          # PostgreSQL + PostGIS table definitions
│   └── seed.sql            # Initial seed records for pilot districts
└── .gitignore              # Ignored files (node_modules, venv, cache)
```

---

## 🔒 Security & Best Practices
- Never commit `node_modules/`, `venv/`, or `.env` files to the repository.
- Ensure all API endpoints validate input types before computation.
- Maintain deterministic financial calculations (10% margin + 90% loan) in sync across all models.
