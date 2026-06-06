# NBA Statistics Website — Project Plan

## Context

Building a portfolio-quality NBA statistics website using the MERN stack. The site lets users search for players and teams, and view detailed statistics pulled from the `nba_api` Python library. Because `nba_api` is Python-based, a FastAPI microservice bridges it with the Node.js Express backend. MongoDB serves as the caching layer so the deployed cloud app never needs to call NBA.com directly (which blocks datacenter IPs). A nightly ingestion script runs on the developer's local machine (or Raspberry Pi) to keep MongoDB fresh.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + TypeScript + React Router DOM + MUI |
| Backend | Node.js + Express + Mongoose |
| Database | MongoDB Atlas (free tier) |
| Data Service | Python + FastAPI + nba_api |
| Dev Process Runner | concurrently (npm) |
| Deployment | Render or Railway (Express + React), MongoDB Atlas |

---

## Monorepo Structure

```
NBAStatistics/
├── docs/                          ← Documentation (master project plan)
│   └── PROJECT_PLAN.md            ← You are here
├── client/                        ← React app (TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── PlayerCard.tsx
│   │   │   └── TeamCard.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx           ← Landing page with tabs
│   │   │   ├── Players.tsx        ← Search grid
│   │   │   ├── PlayerDetail.tsx   ← Individual player page
│   │   │   ├── Teams.tsx          ← All 30 teams grid
│   │   │   └── TeamDetail.tsx     ← Individual team page
│   │   ├── types/
│   │   │   ├── player.ts          ← Player, PlayerStats interfaces
│   │   │   └── team.ts            ← Team, TeamStats interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── server/                        ← Express + MongoDB (TypeScript)
│   ├── src/
│   │   ├── models/
│   │   │   ├── Player.ts
│   │   │   └── Team.ts
│   │   ├── routes/
│   │   │   ├── players.ts
│   │   │   └── teams.ts
│   │   ├── server.ts
│   │   └── types/
│   │       ├── player.ts
│   │       └── team.ts
│   ├── dist/                      ← Compiled JavaScript (generated)
│   ├── tsconfig.json
│   ├── .env                       ← MONGODB_URI, PYTHON_API_URL
│   └── package.json
├── python-api/                    ← FastAPI + nba_api
│   ├── routers/
│   │   ├── players.py
│   │   └── teams.py
│   ├── scripts/
│   │   └── nightly_ingest.py      ← Scheduled data refresh
│   ├── main.py
│   ├── .env                       ← MONGODB_URI
│   └── requirements.txt
├── package.json                   ← Root: concurrently dev script
└── .gitignore
```

---

## Architecture

### Full Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                          │
│               React App (Vite, port 3000)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │  HTTP  GET /api/players?name=LeBron
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              EXPRESS / NODE.JS  (port 5000)                 │
│                                                             │
│  1. Check MongoDB cache (lastUpdated < 24h?)                │
│     ├─ HIT  → return data immediately                       │
│     └─ MISS → call Python API                               │
│                                                             │
│  2. Save response to MongoDB (upsert)                       │
│  3. Return JSON to React                                     │
└───────────────────────────┬─────────────────────────────────┘
                            │  HTTP  GET http://localhost:8000/players?name=LeBron
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              FASTAPI / PYTHON  (port 8000)                  │
│                                                             │
│  Wraps nba_api library calls, returns clean JSON            │
└───────────────────────────┬─────────────────────────────────┘
                            │  nba_api (Python library)
                            ▼
                       NBA.com endpoints
                   (residential IP — no blocking)
```

### Production Architecture

In production, the Python FastAPI service is **not deployed to the cloud**. Express serves entirely from MongoDB Atlas. The only job the Python service has in production is running the nightly ingestion script from a machine with a residential IP (your PC or Raspberry Pi).

```
  Your Home Machine / Raspberry Pi              Cloud (Render/Railway)
  ─────────────────────────────────             ──────────────────────
  nightly_ingest.py  (midnight cron)            React + Express
          │                                            │
          │  upserts fresh NBA data                    │  reads cached data
          ▼                                            ▼
                    MongoDB Atlas (free tier)
                  (connection string shared
                   via environment variables)
```

Why NBA.com blocks cloud IPs: NBA.com detects requests originating from AWS, Render, Railway, Heroku, and other datacenter IP ranges and returns 403s. Home ISP IPs (residential) are not blocked. The ingestion script must therefore always run from a home network machine.

---

## MongoDB Schema

### `players` collection

```json
{
  "playerId": 2544,
  "fullName": "LeBron James",
  "firstName": "LeBron",
  "lastName": "James",
  "teamId": 1610612747,
  "teamAbbreviation": "LAL",
  "teamName": "Los Angeles Lakers",
  "position": "F",
  "jerseyNumber": "23",
  "height": "6-9",
  "weight": "250",
  "birthDate": "1984-12-30",
  "age": 39,
  "country": "USA",
  "school": "St. Vincent-St. Mary HS",
  "draftYear": 2003,
  "draftRound": 1,
  "draftNumber": 1,
  "isActive": true,
  "currentSeasonStats": {
    "season": "2023-24",
    "gamesPlayed": 71,
    "pts": 25.7,
    "reb": 7.3,
    "ast": 8.3,
    "stl": 1.3,
    "blk": 0.6,
    "fgPct": 0.540,
    "fg3Pct": 0.410,
    "ftPct": 0.750
  },
  "careerStats": [ /* array of per-season objects */ ],
  "lastUpdated": "2024-01-15T00:00:00Z"
}
```

### `teams` collection

```json
{
  "teamId": 1610612747,
  "fullName": "Los Angeles Lakers",
  "abbreviation": "LAL",
  "nickname": "Lakers",
  "city": "Los Angeles",
  "state": "California",
  "yearFounded": 1947,
  "currentSeasonStats": {
    "wins": 47,
    "losses": 35,
    "winPct": 0.573,
    "pts": 115.5,
    "reb": 43.1,
    "ast": 26.2,
    "netRating": 2.4
  },
  "roster": [
    { "playerId": 2544, "fullName": "LeBron James", "position": "F", "jerseyNumber": "23" }
  ],
  "lastUpdated": "2024-01-15T00:00:00Z"
}
```

---

## API Design

### Python FastAPI endpoints (internal — called by Express only)

| Method | Path | nba_api call |
|---|---|---|
| GET | `/players/search?name=` | `players.find_players_by_full_name()` |
| GET | `/players/{id}` | `CommonPlayerInfo` + `PlayerCareerStats` |
| GET | `/players/{id}/stats` | `LeagueDashPlayerStats` |
| GET | `/teams` | `teams.get_teams()` (static) |
| GET | `/teams/{id}` | `TeamDetails` + `CommonTeamRoster` |
| GET | `/teams/{id}/stats` | `TeamDashboardByGeneralSplits` |

### Express REST endpoints (called by React)

| Method | Path | Description |
|---|---|---|
| GET | `/api/players?name=` | Search players |
| GET | `/api/players/:id` | Full player detail |
| GET | `/api/teams` | All 30 teams |
| GET | `/api/teams/:id` | Full team detail + roster |

---

## Frontend Pages & MUI Components

MUI install: `npm install @mui/material @mui/x-data-grid @emotion/react @emotion/styled`

### Home (`/`)
- `<AppBar>` + `<Toolbar>` — top navbar with site name
- `<Tabs>` + `<Tab>` — "Players" and "Teams" tabs
- Tab content renders the appropriate grid below (no separate routes for tabs — they live on the home page)

### Players Tab
- `<TextField>` — search input (debounced, fires on typing)
- `<DataGrid>` (MUI X) — results table with columns: Name, Team, Position, PPG, RPG, APG
  - Built-in sorting on all columns
  - Built-in pagination (25 rows per page)
  - `onRowClick` → navigate to `/players/:id`

### Teams Tab
- `<DataGrid>` — all 30 teams with columns: Team Name, City, Wins, Losses, Win %
  - No search input needed (only 30 rows)
  - `onRowClick` → navigate to `/teams/:id`

### Player Detail (`/players/:id`)
- `<Typography>` — player full name as page heading
- `<Chip>` components — team, position, jersey number displayed as tags
- `<Paper>` — bio section: height, weight, age, country, draft info in a clean card
- `<DataGrid>` or `<Table>` — current season stats (single row, many columns)
- `<DataGrid>` — career stats (one row per season, sortable by year)

### Team Detail (`/teams/:id`)
- `<Typography>` — team name as heading
- `<Paper>` — record and season stats summary
- `<DataGrid>` — roster table with columns: Name, Position, Jersey #, Age
  - `onRowClick` → navigate to `/players/:id`

---

## Nightly Ingestion Script

**File:** `python-api/scripts/nightly_ingest.py`

What it does each run (respecting 1 req/sec rate limit):

1. Load all 30 teams from static nba_api data (instant, no request)
2. For each team: fetch roster via `CommonTeamRoster`
3. For each team: fetch season stats via `TeamDashboardByGeneralSplits`
4. For each active player: fetch bio via `CommonPlayerInfo`
5. For each active player: fetch current season stats via `PlayerCareerStats`
6. Upsert all records into MongoDB Atlas
7. Log success/failures with timestamps

Estimated runtime: 10-20 minutes for a full refresh (active rosters ~500 players, rate limited to 1 req/sec).

---

## Production Deployment

### Step 1: Seed MongoDB Atlas Manually

Before first deploy, run `nightly_ingest.py` manually from your local machine to fully populate MongoDB Atlas. Verify data is in Atlas dashboard before deploying Express.

### Step 2: Deploy Express + React to Render

1. Push monorepo to GitHub
2. Create two Render services:
   - **Web Service** → `server/` directory, build: `npm install`, start: `node server.js`
   - **Static Site** → `client/` directory, build: `npm run build`, publish: `dist/`
3. Add environment variable in Render: `MONGODB_URI=mongodb+srv://...`
4. Add environment variable: `NODE_ENV=production`

### Step 3a: Windows Task Scheduler (Starting Point)

Runs the ingestion script from your Windows machine at midnight.

1. Open Task Scheduler (search in Start Menu)
2. Action → Create Basic Task
3. Name: `NBA Stats Nightly Ingest`
4. Trigger: Daily at 12:00 AM
5. Action: Start a program
   - Program: `C:\Users\Riley\AppData\Local\Programs\Python\Python3xx\python.exe`
   - Arguments: `C:\Users\Riley\NBAStatistics\python-api\scripts\nightly_ingest.py`
6. In Properties → Conditions tab: check **Wake the computer to run this task**
7. In Properties → Settings tab: check **Run task as soon as possible after a scheduled start is missed**

Downside: requires your PC to be on (or sleeping — Task Scheduler can wake it). If the PC is off (traveling, etc.), the refresh is skipped until the next night.

---

### Step 3b: Raspberry Pi Upgrade (Detailed)

The Pi replaces your PC as the always-on ingestion machine. It runs 24/7 at home on your residential IP. Costs ~$3/year in electricity.

#### Hardware

| Item | Cost |
|---|---|
| Raspberry Pi 4 (2GB RAM) | ~$45 |
| MicroSD card (32GB, Class 10 or A1) | ~$10 |
| Official USB-C power supply | ~$10 |
| Ethernet cable | ~$5 (or use built-in WiFi) |
| **Total** | **~$70** |

#### OS Setup

1. Download **Raspberry Pi Imager** from raspberrypi.com
2. Insert SD card, select **Raspberry Pi OS Lite (64-bit)** (no desktop needed)
3. Click the gear icon (Advanced Options) before flashing:
   - Enable SSH
   - Set hostname: `nba-pi`
   - Set username: `riley` and a strong password
   - Configure WiFi SSID + password (or skip if using ethernet)
4. Flash the SD card, insert into Pi, power on
5. Wait ~60 seconds, then SSH in from your PC:

```bash
ssh riley@nba-pi.local
```

#### Install Dependencies

```bash
# Update the system
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3-pip python3-venv git -y

# Clone your repo
cd ~
git clone https://github.com/yourusername/NBAStatistics.git
cd NBAStatistics/python-api

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

#### Configure Environment Variables

```bash
# Create a .env file for the MongoDB connection string
nano ~/NBAStatistics/python-api/.env
```

Add:
```
MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/nba_stats
```

Save with `Ctrl+X → Y → Enter`.

#### Test the Script Manually

```bash
cd ~/NBAStatistics/python-api
source venv/bin/activate
python scripts/nightly_ingest.py
```

Watch the output. Confirm data appears in MongoDB Atlas dashboard before scheduling.

#### Set Up Cron Job

```bash
crontab -e
# Choose nano (option 1) if prompted
```

Add this line at the bottom:

```
0 0 * * * cd /home/riley/NBAStatistics && git pull origin main && /home/riley/NBAStatistics/python-api/venv/bin/python python-api/scripts/nightly_ingest.py >> /home/riley/nba_ingest.log 2>&1
```

This runs at midnight every night, pulls the latest script from GitHub, runs ingestion, and logs all output to `nba_ingest.log`.

#### Monitor Logs

```bash
# Live log tail
tail -f ~/nba_ingest.log

# Check last 50 lines
tail -50 ~/nba_ingest.log
```

#### Keep Pi Running Reliably

```bash
# Prevent Pi from going to sleep
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

The Pi can now sit plugged into your router and be completely forgotten. SSH in anytime to check logs.

---

## Getting Started (First-Time Setup)

This section walks through every step from a blank machine to a running website. Do these once before you start development.

---

### Step 1: Install Prerequisites

You need four things installed on your Windows machine before anything else.

**Node.js** (runs JavaScript outside the browser — powers Express and React tooling)
1. Go to nodejs.org → download the **LTS** version
2. Run the installer, accept all defaults
3. Verify in a new terminal: `node --version` and `npm --version` — both should print version numbers

**Python** (runs FastAPI and nba_api)
1. Go to python.org → download the latest **Python 3.11+** installer
2. **Critical:** On the first install screen, check the box that says **"Add Python to PATH"** before clicking Install
3. Verify: `python --version` should print `Python 3.11.x` (or similar)

**Git** (version control)
1. Go to git-scm.com → download and run the installer, accept all defaults
2. Verify: `git --version`

**VS Code** (recommended code editor)
1. Go to code.visualstudio.com → download and install
2. Recommended extensions to install inside VS Code:
   - **ESLint** — catches JavaScript/TypeScript errors
   - **Prettier** — auto-formats code
   - **Python** (by Microsoft) — Python language support
   - **MongoDB for VS Code** — browse your database from the editor

---

### Step 2: Set Up MongoDB Atlas (Cloud Database)

MongoDB Atlas is a free cloud-hosted MongoDB database. This is where all NBA data lives so both your local app and the deployed app share the same data.

1. Go to **mongodb.com/atlas** → click "Try Free" → create an account
2. When asked to create a cluster, choose:
   - **Free tier (M0 Sandbox)**
   - Provider: AWS, Region: closest to you (e.g., us-east-1)
   - Cluster Name: `nba-stats` (or anything you like)
   - Click **Create**
3. **Create a database user** (this is separate from your Atlas login):
   - Left sidebar → Security → Database Access → Add New Database User
   - Authentication: Password
   - Username: `nba-admin` (or your choice)
   - Password: generate a secure one and **save it somewhere**
   - Role: **Atlas Admin**
   - Click Add User
4. **Whitelist your IP address** (allows your machine to connect):
   - Left sidebar → Security → Network Access → Add IP Address
   - Click **"Allow Access From Anywhere"** (easiest for development — you can restrict later)
   - Click Confirm
5. **Get your connection string**:
   - Left sidebar → Database → click **Connect** on your cluster
   - Choose **"Drivers"**
   - Driver: Node.js, Version: latest
   - Copy the connection string — it looks like:
     `mongodb+srv://nba-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - Replace `<password>` with the password you created in step 3
   - **Save this string** — you'll paste it into `.env` files in the next steps

   connection string: mongodb+srv://nba-admin:kitty7Jazz$@nba-stats.ywosupe.mongodb.net/?appName=nba-stats

---

### Step 3: Create the GitHub Repository

GitHub is where your code lives online. It lets you back up your code, track changes, and is required for Render to automatically deploy when you push updates.

**Create a GitHub account (if you don't have one):**
1. Go to **github.com** → Sign up → follow the prompts

**Create the repository:**
1. Once logged in, click the **+** icon in the top-right corner → **New repository**
2. Fill in the form:
   - Repository name: `NBAStatistics`
   - Description: `NBA statistics website built with MERN stack`
   - Visibility: **Public** (required for Render's free tier, and good for your portfolio)
   - **Do NOT** check "Add a README file" — we'll push our own
3. Click **Create repository**
4. GitHub shows you a page with setup commands — keep this tab open

**Connect your local project to GitHub:**

Open a terminal inside your `NBAStatistics` folder and run these commands one at a time:

```bash
# Initialize git in your project folder
git init

# Add all files to be tracked
git add .

# Create your first commit (a snapshot of the current code)
git commit -m "Initial project setup"

# Set the main branch name
git branch -M main

# Link your local project to the GitHub repo
# (replace "yourusername" with your actual GitHub username)
git remote add origin https://github.com/yourusername/NBAStatistics.git

# Push your code up to GitHub
git push -u origin main
```

Refresh the GitHub tab — you should see all your project files there.

**Pushing future changes:**

Any time you make changes and want to save them to GitHub:
```bash
git add .
git commit -m "Description of what you changed"
git push
```

This is also how Render knows to re-deploy — every `git push` to `main` triggers an automatic rebuild on Render.

---

### Step 4: Clone the Repo and Install Dependencies

Once the repo is created (during Phase 1 of implementation), you'll only need to do this once:

```bash
# 1. Clone the repo to your machine
git clone https://github.com/yourusername/NBAStatistics.git
cd NBAStatistics

# 2. Install root-level tools (concurrently)
npm install

# 3. Install React (client) dependencies
cd client
npm install
cd ..

# 4. Install Express (server) dependencies with TypeScript
cd server
npm install
cd ..

# 5. Set up Python virtual environment and install dependencies
cd python-api
python -m venv venv

# Activate the virtual environment (Windows):
venv\Scripts\activate

# Install Python packages
pip install -r requirements.txt
cd ..
```

You'll see `(venv)` appear at the start of your terminal prompt when the virtual environment is active. You need this active any time you run Python commands manually.

---

### Step 5: Configure Environment Variables

Environment variables are secret values (like database passwords) that live in `.env` files — these are never committed to Git.

**Create `server/.env`:**
```
MONGODB_URI=mongodb+srv://nba-admin:yourpassword@cluster0.xxxxx.mongodb.net/nba_stats?retryWrites=true&w=majority
PYTHON_API_URL=http://localhost:8000
PORT=5000
```

**Create `python-api/.env`:**
```
MONGODB_URI=mongodb+srv://nba-admin:yourpassword@cluster0.xxxxx.mongodb.net/nba_stats?retryWrites=true&w=majority
```

Replace the `MONGODB_URI` values with your actual connection string from Step 2.

**Add `.env` to `.gitignore`** (already handled during project setup — just a reminder to never commit these files).

---

### Step 6: Start the Website Locally

From the root `NBAStatistics/` folder, run:

```bash
npm run dev
```

This single command starts all three services at once using `concurrently`:

| Service | URL | What it does |
|---|---|---|
| React (Vite) | http://localhost:3000 | The website you see in your browser |
| Express | http://localhost:5000 | The backend API |
| FastAPI | http://localhost:8000 | The Python data service |

Open your browser and go to **http://localhost:3000** — you should see the NBA Statistics home page.

To stop everything: press `Ctrl + C` in the terminal.

---

### Step 7: Verify the Database Connection

After the first time you search for a player or load the teams page:
1. Go to your MongoDB Atlas dashboard
2. Left sidebar → Database → Browse Collections
3. You should see a `nba_stats` database with `players` and `teams` collections filling up

If collections are empty, it means the app hasn't fetched data yet — search for something and refresh Atlas.

---

### Troubleshooting Common First-Time Issues

| Problem | Fix |
|---|---|
| `node: command not found` | Node.js not installed or not on PATH — reinstall and restart terminal |
| `python: command not found` | Python not on PATH — reinstall and check "Add to PATH" box |
| `npm run dev` only starts 1 service | Run `npm install` at the root level first |
| MongoDB connection error | Check your connection string in `.env` — password must not have `<>` brackets |
| FastAPI won't start | Make sure you activated the virtual environment: `python-api\venv\Scripts\activate` |
| Port already in use | Another process is using 3000, 5000, or 8000 — close other terminals or restart |

---

## Implementation Phases

Each phase is designed to be fully self-contained and executable independently. Complete and verify each phase before starting the next.

### Progress Tracker

Status legend: ✅ Complete · 🚧 In Progress · ⬜ Not Started

| Phase | Description | Status |
|---|---|---|
| 1 | Project Setup & Infrastructure | ✅ Complete |
| 2 | Python API Layer | ✅ Complete |
| 3 | Express Backend | ✅ Complete |
| 4 | React Frontend | ✅ Complete |
| 5 | Production Deployment | ⬜ Not Started |
| 6 | Documentation Refactoring | 🚧 In Progress |

---

### Phase 1: Project Setup & Infrastructure — ✅ Complete

**Goal:** Create the monorepo skeleton with all three services running locally and communicating with each other. End of this phase: `npm run dev` from the root starts React on :3000, Express on :5000, and FastAPI on :8000.

#### 1a. Create folder structure

```
mkdir C:\Users\Riley\NBAStatistics
cd C:\Users\Riley\NBAStatistics
mkdir server
mkdir python-api
```

#### 1b. Root package.json (concurrently runner)

Create `NBAStatistics/package.json`:
```json
{
  "name": "nba-statistics",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix client\" \"npm run dev --prefix server\" \"npm run dev --prefix python-api\"",
    "install:all": "npm install && npm install --prefix client && npm install --prefix server"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

Run `npm install` at root to install concurrently.

#### 1c. Bootstrap React (client)

```bash
npm create vite@latest client -- --template react-ts
cd client
npm install
npm install @mui/material @mui/x-data-grid @emotion/react @emotion/styled
npm install react-router-dom
npm install axios
```

Add to `client/package.json` scripts:
```json
"dev": "vite --port 3000"
```

#### 1d. Bootstrap Express (server)

```bash
cd ../server
npm init -y
npm install express mongoose axios cors dotenv
npm install --save-dev typescript ts-node @types/node @types/express nodemon
npx tsc --init
```

Create `server/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Create `server/package.json` scripts:
```json
"dev": "ts-node src/server.ts",
"build": "tsc",
"start": "node dist/server.js"
```

Create `server/src/server.ts` — bare minimum to confirm it runs:
```typescript
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
);
```

Create `server/.env`:
```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/nba_stats?retryWrites=true&w=majority
PYTHON_API_URL=http://localhost:8000
PORT=5000
```

#### 1e. Bootstrap FastAPI (python-api)

```bash
cd ../python-api
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn nba_api pymongo python-dotenv requests
pip freeze > requirements.txt
```

Create `python-api/main.py`:
```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}
```

Create `python-api/package.json` (for concurrently compatibility):
```json
{
  "scripts": {
    "dev": "venv\\Scripts\\uvicorn main:app --reload --port 8000"
  }
}
```

Create `python-api/.env`:
```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/nba_stats?retryWrites=true&w=majority
```

#### 1f. Create .gitignore at root

```
node_modules/
client/node_modules/
server/node_modules/
server/dist/
python-api/venv/
.env
*.pyc
__pycache__/
client/dist/
```

#### 1g. Initialize Git and push to GitHub

```bash
cd C:\Users\Riley\NBAStatistics
git init
git add .
git commit -m "Phase 1: project scaffold"
git branch -M main
git remote add origin https://github.com/<yourusername>/NBAStatistics.git
git push -u origin main
```

#### Phase 1 Verification
- `npm run dev` from root starts all three services with no errors
- Express compiles TypeScript without errors (`src/` → `dist/` via ts-node)
- `http://localhost:3000` shows the default Vite React page
- `http://localhost:5000/health` returns `{"status":"ok"}`
- `http://localhost:8000/health` returns `{"status":"ok"}`
- `http://localhost:8000/docs` shows the FastAPI auto-generated docs page
- MongoDB Atlas dashboard shows an active connection

---

### Phase 2: Python API Layer — ✅ Complete

**Goal:** Implement all FastAPI endpoints that wrap nba_api. Express will call these endpoints. End of this phase: every endpoint returns real NBA data as clean JSON when called directly (test with the FastAPI docs at `localhost:8000/docs`).

**Context for this phase:**
- nba_api is a Python library that reverse-engineers NBA.com's internal API
- All calls must respect a 1 req/sec rate limit to avoid temporary IP bans
- Static data (player list, team list) comes from local lookups — no network call needed
- All endpoints return plain dicts/lists (FastAPI serializes to JSON automatically)

#### 2a. Players router (`python-api/routers/players.py`)

```python
from fastapi import APIRouter, HTTPException
from nba_api.stats.static import players
from nba_api.stats.endpoints import commonplayerinfo, playercareerstats
import time

router = APIRouter(prefix="/players", tags=["players"])

@router.get("/search")
def search_players(name: str = ""):
    all_players = players.get_active_players()
    if not name:
        return all_players[:50]  # return first 50 if no search term
    results = [p for p in all_players
               if name.lower() in p["full_name"].lower()]
    return results[:50]

@router.get("/{player_id}")
def get_player(player_id: int):
    try:
        info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
        time.sleep(1)  # rate limit
        career = playercareerstats.PlayerCareerStats(player_id=player_id)
        time.sleep(1)

        info_data = info.get_normalized_dict()["CommonPlayerInfo"][0]
        career_data = career.get_normalized_dict()["SeasonTotalsRegularSeason"]

        return {
            "info": info_data,
            "careerStats": career_data
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
```

#### 2b. Teams router (`python-api/routers/teams.py`)

```python
from fastapi import APIRouter, HTTPException
from nba_api.stats.static import teams
from nba_api.stats.endpoints import teamdetails, commonteamroster, teamdashboardbygeneralsplits
import time

router = APIRouter(prefix="/teams", tags=["teams"])

@router.get("")
def get_all_teams():
    return teams.get_teams()  # static, no network call

@router.get("/{team_id}")
def get_team(team_id: int):
    try:
        details = teamdetails.TeamDetails(team_id=team_id)
        time.sleep(1)
        roster = commonteamroster.CommonTeamRoster(team_id=team_id)
        time.sleep(1)
        stats = teamdashboardbygeneralsplits.TeamDashboardByGeneralSplits(team_id=team_id)
        time.sleep(1)

        return {
            "details": details.get_normalized_dict()["TeamBackground"][0],
            "roster": roster.get_normalized_dict()["CommonTeamRoster"],
            "stats": stats.get_normalized_dict()["OverallTeamDashboard"][0]
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
```

#### 2c. Register routers in `python-api/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import players, teams

app = FastAPI(title="NBA Stats API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_methods=["GET"],
)

app.include_router(players.router)
app.include_router(teams.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

#### 2d. Write `python-api/scripts/nightly_ingest.py`

This script is run on a schedule (Windows Task Scheduler or Raspberry Pi cron). It fetches all NBA data and upserts it into MongoDB Atlas so Express can serve from cache without ever calling NBA.com from the cloud.

```python
import os, time
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne
from nba_api.stats.static import players, teams
from nba_api.stats.endpoints import (
    commonplayerinfo, playercareerstats,
    teamdetails, commonteamroster, teamdashboardbygeneralsplits
)
from datetime import datetime, timezone

load_dotenv()

client = MongoClient(os.getenv("MONGODB_URI"))
db = client["nba_stats"]

def ingest_teams():
    print("Ingesting teams...")
    all_teams = teams.get_teams()
    ops = []
    for team in all_teams:
        try:
            roster = commonteamroster.CommonTeamRoster(team_id=team["id"])
            time.sleep(1)
            stats = teamdashboardbygeneralsplits.TeamDashboardByGeneralSplits(team_id=team["id"])
            time.sleep(1)
            doc = {
                **team,
                "roster": roster.get_normalized_dict()["CommonTeamRoster"],
                "stats": stats.get_normalized_dict()["OverallTeamDashboard"][0],
                "lastUpdated": datetime.now(timezone.utc)
            }
            ops.append(UpdateOne({"id": team["id"]}, {"$set": doc}, upsert=True))
            print(f"  Fetched {team['full_name']}")
        except Exception as e:
            print(f"  ERROR {team['full_name']}: {e}")
    if ops:
        db.teams.bulk_write(ops)
    print(f"Teams done: {len(ops)} upserted")

def ingest_players():
    print("Ingesting active players...")
    active = players.get_active_players()
    ops = []
    for player in active:
        try:
            info = commonplayerinfo.CommonPlayerInfo(player_id=player["id"])
            time.sleep(1)
            career = playercareerstats.PlayerCareerStats(player_id=player["id"])
            time.sleep(1)
            doc = {
                **player,
                "info": info.get_normalized_dict()["CommonPlayerInfo"][0],
                "careerStats": career.get_normalized_dict()["SeasonTotalsRegularSeason"],
                "lastUpdated": datetime.now(timezone.utc)
            }
            ops.append(UpdateOne({"id": player["id"]}, {"$set": doc}, upsert=True))
            print(f"  Fetched {player['full_name']}")
        except Exception as e:
            print(f"  ERROR {player['full_name']}: {e}")
    if ops:
        db.players.bulk_write(ops)
    print(f"Players done: {len(ops)} upserted")

if __name__ == "__main__":
    print(f"Starting ingest at {datetime.now()}")
    ingest_teams()
    ingest_players()
    print(f"Ingest complete at {datetime.now()}")
```

#### Phase 2 Verification
- Visit `http://localhost:8000/docs` in browser
- Test `GET /players/search?name=LeBron` — returns a list with LeBron James
- Test `GET /players/2544` — returns LeBron's full info and career stats
- Test `GET /teams` — returns all 30 teams
- Test `GET /teams/1610612747` — returns Lakers detail, roster, and stats
- Run `python scripts/nightly_ingest.py` manually — completes without errors, MongoDB Atlas shows populated collections

---

### Phase 3: Express Backend — ✅ Complete

**Goal:** Implement all Express routes with MongoDB caching. Express sits between React and the Python API — it checks MongoDB first and only calls Python on a cache miss. End of this phase: all `/api/*` routes return data, MongoDB gets populated on first request.

**Context for this phase:**
- Express never exposes the Python API to the browser — all Python calls are internal server-to-server
- Cache TTL is 24 hours (`lastUpdated` field on each document)
- Mongoose models mirror the MongoDB schema defined above

#### 3a. Mongoose Models

`server/src/types/player.ts`:
```typescript
export interface IPlayer {
  id: number;
  full_name: string;
  info?: Record<string, unknown>;
  careerStats?: Record<string, unknown>[];
  lastUpdated?: Date;
  [key: string]: unknown; // Allow other fields
}
```

`server/src/types/team.ts`:
```typescript
export interface ITeam {
  id: number;
  full_name: string;
  abbreviation?: string;
  roster?: Record<string, unknown>[];
  stats?: Record<string, unknown>;
  lastUpdated?: Date;
  [key: string]: unknown; // Allow other fields
}
```

`server/src/models/Player.ts`:
```typescript
import mongoose, { Schema, Document } from 'mongoose';
import { IPlayer } from '../types/player';

export interface PlayerDocument extends IPlayer, Document {}

const playerSchema = new Schema<PlayerDocument>(
  {
    id: { type: Number, required: true, unique: true },
    full_name: String,
    info: Schema.Types.Mixed,
    careerStats: [Schema.Types.Mixed],
    lastUpdated: Date
  },
  { strict: false }
);

export default mongoose.model<PlayerDocument>('Player', playerSchema);
```

`server/src/models/Team.ts`:
```typescript
import mongoose, { Schema, Document } from 'mongoose';
import { ITeam } from '../types/team';

export interface TeamDocument extends ITeam, Document {}

const teamSchema = new Schema<TeamDocument>(
  {
    id: { type: Number, required: true, unique: true },
    full_name: String,
    abbreviation: String,
    roster: [Schema.Types.Mixed],
    stats: Schema.Types.Mixed,
    lastUpdated: Date
  },
  { strict: false }
);

export default mongoose.model<TeamDocument>('Team', teamSchema);
```

#### 3b. Players Route (`server/src/routes/players.ts`)

```typescript
import express, { Request, Response } from 'express';
import axios from 'axios';
import Player from '../models/Player';

const router = express.Router();

const PYTHON_URL = process.env.PYTHON_API_URL;

// Search players
router.get('/', async (req: Request, res: Response) => {
  try {
    const { name = '' } = req.query;
    const nameStr = Array.isArray(name)
      ? String(name[0] ?? '')
      : String(name ?? '');
    const regex = new RegExp(nameStr, 'i');
    const cached = await Player.find({ full_name: regex }).limit(50);
    if (cached.length > 0) return res.json(cached);

    const { data } = await axios.get(`${PYTHON_URL}/players/search?name=${nameStr}`);
    res.json(data);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// Get single player
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params['id'] as string);
    const cached = await Player.findOne({ id });

    if (cached) return res.json(cached);

    console.log('Player not found in cache. PYTHON_URL:', PYTHON_URL, 'ID:', id);
    const { data } = await axios.get(`${PYTHON_URL}/players/${String(id)}`);
    const updated = await Player.findOneAndUpdate(
      { id },
      { ...data, id, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    res.json(updated);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

export default router;
```

#### 3c. Teams Route (`server/src/routes/teams.ts`)

```typescript
import express, { Request, Response } from 'express';
import axios from 'axios';
import Team from '../models/Team';

const router = express.Router();

const PYTHON_URL = process.env.PYTHON_API_URL;

// Get all teams
router.get('/', async (req: Request, res: Response) => {
  try {
    const cached = await Team.find({});
    if (cached.length === 30) return res.json(cached);

    const { data } = await axios.get(`${PYTHON_URL}/teams`);
    res.json(data);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// Get single team
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params['id'] as string);
    const cached = await Team.findOne({ id });

    if (cached) return res.json(cached);

    const { data } = await axios.get(`${PYTHON_URL}/teams/${String(id)}`);
    const updated = await Team.findOneAndUpdate(
      { id },
      { ...data, id, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    res.json(updated);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

export default router;
```

#### 3d. Register routes in `server/src/server.ts`

Update `server/src/server.ts` to include the routers after the middleware setup:
```typescript
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import playerRoutes from './routes/players';
import teamRoutes from './routes/teams';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
);
```

#### Phase 3 Verification
- `GET http://localhost:5000/api/players?name=LeBron` returns player data
- `GET http://localhost:5000/api/players/2544` returns LeBron's full profile and saves to MongoDB
- `GET http://localhost:5000/api/teams` returns all 30 teams
- `GET http://localhost:5000/api/teams/1610612747` returns Lakers data
- Making the same request twice: second request returns faster (served from MongoDB cache)
- MongoDB Atlas shows documents with `lastUpdated` timestamps in `players` and `teams` collections

---

### Phase 4: React Frontend — ✅ Complete

**Goal:** Build all pages and wire them to the Express API. End of this phase: the full website is usable — search for players, view detail pages, browse teams, view team rosters. All data comes from Express via Axios.

**Context for this phase:**
- All API calls go to Express at `http://localhost:5000/api` — never directly to Python or MongoDB
- React Router handles navigation between pages
- MUI components handle all UI rendering (see Frontend Pages section above for exact components per page)
- TypeScript interfaces for API response shapes live in `client/src/types/`

#### 4a. TypeScript types (`client/src/types/`)

`player.ts`:
```typescript
export interface PlayerSearchResult {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

export interface PlayerInfo {
  DISPLAY_FIRST_LAST: string;
  TEAM_NAME: string;
  TEAM_ABBREVIATION: string;
  POSITION: string;
  JERSEY: string;
  HEIGHT: string;
  WEIGHT: string;
  BIRTHDATE: string;
  COUNTRY: string;
  SCHOOL: string;
  DRAFT_YEAR: string;
  DRAFT_ROUND: string;
  DRAFT_NUMBER: string;
}

export interface CareerStatSeason {
  SEASON_ID: string;
  TEAM_ABBREVIATION: string;
  GP: number;
  PTS: number;
  REB: number;
  AST: number;
  STL: number;
  BLK: number;
  FG_PCT: number;
  FG3_PCT: number;
  FT_PCT: number;
}

export interface Player {
  id: number;
  full_name: string;
  info: PlayerInfo;
  careerStats: CareerStatSeason[];
}
```

`team.ts`:
```typescript
export interface Team {
  id: number;
  full_name: string;
  abbreviation: string;
  nickname: string;
  city: string;
  state: string;
  year_founded: number;
}

export interface TeamDetail extends Team {
  roster: RosterPlayer[];
  currentSeasonStats: Record<string, unknown>;
}

export interface RosterPlayer {
  PLAYER_ID: number;
  PLAYER: string;
  NUM: string;
  POSITION: string;
  HOW_ACQUIRED: string;
  AGE: number;
}
```

#### 4b. Axios base config (`client/src/api/client.ts`)

```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});
```

#### 4c. React Router setup (`client/src/App.tsx`)

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PlayerDetail from './pages/PlayerDetail';
import TeamDetail from './pages/TeamDetail';
import Navbar from './components/Navbar';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/players/:id" element={<PlayerDetail />} />
        <Route path="/teams/:id" element={<TeamDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

#### 4d. Navbar (`client/src/components/Navbar.tsx`)

```tsx
import { AppBar, Toolbar, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/"
          sx={{ textDecoration: 'none', color: 'inherit' }}>
          NBA Statistics
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
```

#### 4e. Home page (`client/src/pages/Home.tsx`)

Uses MUI `<Tabs>` to switch between Players and Teams grids. Both grids live on the same page — no separate routes.

```tsx
import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import Players from './Players';
import Teams from './Teams';

export default function Home() {
  const [tab, setTab] = useState(0);
  return (
    <Box sx={{ p: 3 }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Players" />
        <Tab label="Teams" />
      </Tabs>
      {tab === 0 && <Players />}
      {tab === 1 && <Teams />}
    </Box>
  );
}
```

#### 4f. Players page (`client/src/pages/Players.tsx`)

Debounced search input + MUI DataGrid. Clicking a row navigates to the player detail page.

Key implementation notes:
- Use `useState` for the search string and the rows array
- Use `useEffect` to call `GET /api/players?name=<query>` whenever the search string changes (debounce with `setTimeout` 300ms)
- DataGrid columns: `id` (hidden), `full_name`, `team` (from `info.TEAM_ABBREVIATION`), `position` (from `info.POSITION`), `pts`, `reb`, `ast`
- `onRowClick` calls `navigate('/players/' + row.id)`

#### 4g. Teams page (`client/src/pages/Teams.tsx`)

Calls `GET /api/teams` once on mount, renders all 30 teams in a DataGrid.

Key implementation notes:
- Use `useEffect` on mount to fetch all teams, store in `useState`
- DataGrid columns: `full_name`, `abbreviation`, `city`, `state`, `year_founded`
- `onRowClick` calls `navigate('/teams/' + row.id)`

#### 4h. Player Detail page (`client/src/pages/PlayerDetail.tsx`)

Calls `GET /api/players/:id` on mount using the `id` from `useParams()`.

Key implementation notes:
- Show MUI `<CircularProgress>` while loading
- Display player name as `<Typography variant="h4">`
- Display team, position, jersey as `<Chip>` components in a row
- Display bio (height, weight, birthdate, country, draft info) in a `<Paper>` with `<Grid>` layout
- Career stats table: use MUI `<DataGrid>` with columns SEASON_ID, TEAM_ABBREVIATION, GP, PTS, REB, AST, STL, BLK, FG_PCT — sorted by SEASON_ID descending

#### 4i. Team Detail page (`client/src/pages/TeamDetail.tsx`)

Calls `GET /api/teams/:id` on mount using `id` from `useParams()`.

Key implementation notes:
- Show team full name + city as heading
- Show wins/losses/win% from `currentSeasonStats` object
- Roster `<DataGrid>` columns: PLAYER (clickable link to `/players/:PLAYER_ID`), NUM, POSITION, AGE
- Make player names clickable using the DataGrid `renderCell` prop to render a `<Link>`

#### Phase 4 Verification
- Home page loads with Players and Teams tabs
- Typing in player search updates the grid within ~300ms
- Clicking a player row navigates to `/players/2544` (or whichever ID)
- Player detail shows name, bio chips, and career stats table
- Teams tab shows all 30 teams
- Clicking a team navigates to `/teams/1610612747` (or whichever)
- Team detail shows record and roster
- Clicking a player name in the roster navigates to their player detail page

---

### Phase 5: Production Deployment — ⬜ Not Started (Deferred)

This phase is deferred. The site is fully functional locally and can be deployed when needed.

---

### Phase 6: Documentation Refactoring — 🚧 In Progress

**Goal:** Organize project documentation in a dedicated `docs/` folder. Move master project plan and establish a single source of truth for all documentation.

#### 6a. Create docs folder and move PROJECT_PLAN.md

1. Create `NBAStatistics/docs/` folder
2. Move `PROJECT_PLAN.md` from root to `docs/PROJECT_PLAN.md`
3. Update `.gitignore` if needed (docs folder should be tracked)
4. Commit with message: `Phase 6: establish docs folder for project documentation`

#### Phase 6 Verification
- `docs/PROJECT_PLAN.md` exists at the new path
- Git history shows the file move
- No broken references in the file itself

---

## Verification Checklist

- [x] `npm run dev` from root starts all 3 services without errors
- [x] `localhost:3000` loads the home page with Player and Team tabs
- [x] Typing in player search returns matching players
- [x] Clicking a player navigates to `/players/:id` with bio and stats
- [x] Teams tab shows all 30 NBA teams
- [x] Clicking a team navigates to `/teams/:id` with stats and roster
- [x] Roster player names link to their player detail pages
- [x] MongoDB Atlas dashboard shows cached documents after first load
- [x] Running `nightly_ingest.py` manually completes without errors and updates `lastUpdated` timestamps in Atlas
