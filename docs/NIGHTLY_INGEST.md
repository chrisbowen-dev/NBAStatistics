# Nightly Ingest Script

**File:** `python-api/scripts/nightly_ingest.py`

This script fetches all NBA team and player data from NBA.com and upserts it into MongoDB Atlas. It must run from a machine with a residential IP address — NBA.com blocks requests from cloud datacenter IPs (AWS, Render, Railway, etc.).

---

## How to Run

### Prerequisites

- Python virtual environment set up (see Getting Started in `PROJECT_PLAN.md`)
- `python-api/.env` exists with a valid `MONGODB_URI`

### Steps

1. Open a terminal in the repo root
2. Activate the virtual environment:
	```
	python-api\venv\Scripts\activate
	```
3. Run the script:
	```
	python python-api/scripts/nightly_ingest.py
	```

The script can be invoked from any directory — it resolves the `.env` path relative to its own location automatically.

### Expected output

```
[2026-06-07T00:00:01Z] Nightly ingest started at 2026-06-07T00:00:01Z
[2026-06-07T00:00:01Z] === ingest_teams: starting ===
[2026-06-07T00:00:01Z]   Found 30 teams in static data.
[2026-06-07T00:00:01Z]   [Atlanta Hawks] Fetching franchise details (TeamDetails)...
[2026-06-07T00:00:02Z]   [Atlanta Hawks] Fetching roster (CommonTeamRoster)...
...
[2026-06-07T00:03:30Z] === ingest_teams: complete -- 30 succeeded, 0 failed, 0 inserted, 30 updated. ===
[2026-06-07T00:03:30Z] === ingest_players: starting ===
[2026-06-07T00:03:30Z]   Found ~500 active players in static data.
[2026-06-07T00:03:30Z]   [1/500] LeBron James -- Fetching bio (CommonPlayerInfo)...
...
[2026-06-07T00:20:00Z] === ingest_players: complete -- 498 succeeded, 2 failed, 0 inserted, 498 updated. ===
[2026-06-07T00:20:00Z] Nightly ingest finished at 2026-06-07T00:20:00Z (elapsed: 1199s / 20.0m)
```

### Runtime

- **Teams:** ~3 minutes (30 teams × 3 network calls × 1 sec rate limit)
- **Players:** ~17 minutes (~500 active players × 2 network calls × 1 sec rate limit)
- **Total:** 10–20 minutes depending on API response times

---

## What It Does

The script runs two stages in sequence: teams first, then players.

### Stage 1: Teams

For each of the 30 NBA teams (sourced from static nba_api data — no network call):

1. **TeamDetails** — fetches franchise metadata: arena, owner, head coach, conference/division rank
2. **CommonTeamRoster** — fetches the current roster (player names, jersey numbers, positions, ages)
3. **TeamDashboardByGeneralSplits** — fetches current season stats: wins, losses, win %, points, rebounds, assists, net rating

Each team's data is combined into a single document and upserted into the `teams` collection in MongoDB Atlas, keyed on `team.id`. The `lastUpdated` field is set to the current UTC time.

If any individual team fails (e.g., a timeout), it is logged and skipped — the rest of the teams continue normally.

### Stage 2: Players

For each currently active player (sourced from static nba_api data — no network call):

1. **CommonPlayerInfo** — fetches biographical data: full name, team, position, jersey number, height, weight, birthdate, country, draft info
2. **PlayerCareerStats** (per-game averages) — fetches one row per season the player has played, plus derives `currentSeasonStats` from the most recent entry

Each player's data is combined into a single document and upserted into the `players` collection, keyed on `player.id`. The `lastUpdated` field is set to the current UTC time.

If any individual player fails, it is logged and skipped.

### MongoDB writes

Both stages batch all successful documents into a single `bulk_write` call at the end, minimizing round-trips to Atlas.

### Rate limiting

Every NBA.com network call is followed by `time.sleep(1)` to stay within NBA.com's rate limit and avoid temporary IP bans.

---

## Scheduling

See the **Production Deployment** section of `PROJECT_PLAN.md` for instructions on scheduling this script to run automatically at midnight via Windows Task Scheduler (Step 3a) or a Raspberry Pi cron job (Step 3b).
