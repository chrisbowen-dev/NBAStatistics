# NBA Statistics Website — Project Overview

A portfolio-quality NBA statistics website built on the MERN stack. Users can search
for players and teams and view detailed statistics sourced from the
[`nba_api`](https://github.com/swar/nba_api) Python library.

> This is the public overview of the project's architecture and design. It explains
> **how the system is built and why**, but intentionally omits machine-specific setup
> instructions and credentials.

---

## Context

The site lets users search for players and teams and view detailed statistics. Because
`nba_api` is Python-based, a FastAPI microservice bridges it with the Node.js/Express
backend. MongoDB serves as a caching layer so the deployed cloud app never needs to
call NBA.com directly.

This last point drives the whole architecture: **NBA.com blocks datacenter IPs**
(AWS, Render, Railway, Heroku, etc. receive 403s), while residential/home IPs are not
blocked. So data is ingested from a home machine on a residential connection and stored
in MongoDB Atlas; the cloud app only ever reads from Atlas.

---

## Tech Stack

| Layer              | Technology                                          |
|--------------------|-----------------------------------------------------|
| Frontend           | React (Vite) + TypeScript + React Router DOM + MUI  |
| Backend            | Node.js + Express + Mongoose                         |
| Database           | MongoDB Atlas                                        |
| Data Service       | Python + FastAPI + nba_api                           |
| Dev Process Runner | concurrently (npm)                                  |
| Deployment         | Render (Express + React), MongoDB Atlas             |

---

## Monorepo Structure

```
NBAStatistics/
├── docs/                  ← Public project documentation
├── client/               ← React app (TypeScript + Vite + MUI)
│   └── src/
│       ├── components/   ← Navbar, PlayerCard, TeamCard, ...
│       ├── pages/        ← Home, Players, PlayerDetail, Teams, TeamDetail
│       ├── types/        ← Player / Team TypeScript interfaces
│       └── api/          ← Axios client
├── server/               ← Express + MongoDB (TypeScript)
│   └── src/
│       ├── models/       ← Mongoose models (Player, Team)
│       ├── routes/       ← REST routes (players, teams)
│       └── server.ts
├── python-api/           ← FastAPI + nba_api (local-only data service)
│   ├── routers/          ← players, teams
│   └── scripts/          ← nightly_ingest.py
└── package.json          ← Root: concurrently dev script
```

---

## Architecture

### Development (all services running locally)

```
┌─────────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                          │
│               React App (Vite, port 3000)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │  GET /api/players?name=LeBron
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              EXPRESS / NODE.JS  (port 5000)                 │
│  1. Check MongoDB cache (lastUpdated < 24h?)                │
│     ├─ HIT  → return data immediately                       │
│     └─ MISS → call Python API, then cache the result        │
│  2. Return JSON to React                                     │
└───────────────────────────┬─────────────────────────────────┘
                            │  GET /players?name=LeBron  (server-to-server)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              FASTAPI / PYTHON  (port 8000)                  │
│  Wraps nba_api calls, returns clean JSON                    │
└───────────────────────────┬─────────────────────────────────┘
                            │  nba_api (residential IP — not blocked)
                            ▼
                       NBA.com endpoints
```

### Production

In production the Python FastAPI service is **not deployed to the cloud**. Express
serves entirely from MongoDB Atlas. The Python service's only production role is running
a nightly ingestion job from a machine with a residential IP, which keeps Atlas fresh.

```
  Home Machine (nightly cron)               Cloud (Render)
  ──────────────────────────                ──────────────
  nightly ingest job                        React + Express
          │                                       │
          │  upserts fresh NBA data               │  reads cached data
          ▼                                       ▼
                    MongoDB Atlas
            (shared via connection string)
```

**Why NBA.com blocks cloud IPs:** it detects requests from datacenter IP ranges and
returns 403s. Home ISP (residential) IPs are not blocked, so the ingestion job must run
from a home network machine rather than the cloud.

---

## Data Model

Two MongoDB collections. Schemas are flexible (`strict: false` on the Mongoose models)
to accommodate the wide range of fields `nba_api` returns.

### `players`

Core identity (`id`, `full_name`), a nested `info` object (bio: position, jersey,
height, weight, birthdate, country, draft details), a `careerStats` array (one entry
per season), and a `lastUpdated` timestamp used for cache invalidation.

### `teams`

Core identity (`id`, `full_name`, `abbreviation`, city/state, year founded), a `roster`
array, a `stats` object (record, points, rebounds, assists, net rating), and a
`lastUpdated` timestamp.

---

## API Design

### Python FastAPI endpoints (internal — called by Express only)

| Method | Path                      | nba_api source                          |
|--------|---------------------------|-----------------------------------------|
| GET    | `/players/search?name=`   | `players.find_players_by_full_name()`   |
| GET    | `/players/{id}`           | `CommonPlayerInfo` + `PlayerCareerStats`|
| GET    | `/teams`                  | `teams.get_teams()` (static)            |
| GET    | `/teams/{id}`             | `TeamDetails` + `CommonTeamRoster`      |

### Express REST endpoints (called by React)

| Method | Path                 | Description                       |
|--------|----------------------|-----------------------------------|
| GET    | `/api/players?name=` | Search players                    |
| GET    | `/api/players/:id`   | Full player detail                |
| GET    | `/api/teams`         | All 30 teams                      |
| GET    | `/api/teams/:id`     | Full team detail + roster         |

Express sits between React and Python: it checks MongoDB first and only calls the Python
API on a cache miss (24-hour TTL via `lastUpdated`). The browser never talks to the
Python service or MongoDB directly.

---

## Frontend Pages

Built with MUI components throughout.

| Page             | Route            | Highlights                                                      |
|------------------|------------------|----------------------------------------------------------------|
| **Home**         | `/`              | AppBar navbar + Tabs switching between Players and Teams grids  |
| **Players tab**  | `/`              | Debounced search `TextField` + sortable, paginated `DataGrid`   |
| **Teams tab**    | `/`              | `DataGrid` of all 30 teams                                      |
| **Player Detail**| `/players/:id`   | Bio chips + `Paper` bio card + career stats `DataGrid`          |
| **Team Detail**  | `/teams/:id`     | Record/stats summary + roster `DataGrid` linking to players     |

---

## Data Ingestion

A nightly script (`python-api/scripts/nightly_ingest.py`) refreshes MongoDB Atlas so the
cloud app always has fresh data without ever calling NBA.com itself. Each run, respecting
nba_api's ~1 request/second rate limit:

1. Load all 30 teams from static `nba_api` data
2. Fetch each team's roster and season stats
3. Fetch each active player's bio and career stats
4. Upsert all records into MongoDB Atlas with a fresh `lastUpdated` timestamp

A full refresh takes roughly 10–20 minutes (active rosters total ~500 players, rate
limited). It runs on a schedule from a home machine on a residential IP — see the
deployment model above for why.

---

## Deployment Model

- **React + Express** deploy to Render and read exclusively from MongoDB Atlas.
- **MongoDB Atlas** is the shared source of truth between the ingestion job and the
  cloud app.
- **The Python service is not deployed** — it runs locally only, for the nightly ingest.
- Deployment is **automated from the `main` branch**: merging a release into `main`
  triggers Render to rebuild and redeploy. See [`WORKFLOW.md`](./WORKFLOW.md) for the
  full branching, CI, and release process.

---

## Project Status

| Phase | Description                       | Status         |
|-------|-----------------------------------|----------------|
| 1     | Project Setup & Infrastructure    | ✅ Complete    |
| 2     | Python API Layer                  | ✅ Complete    |
| 3     | Express Backend                   | ✅ Complete    |
| 4     | React Frontend                    | ✅ Complete    |
| 5     | Production Deployment             | ⬜ Not Started |
| 6     | Documentation                     | 🚧 In Progress |

The core application is feature-complete: player search, player detail pages, the teams
grid, team detail pages with rosters, and MongoDB caching all work end to end. Remaining
work is production deployment and documentation.
