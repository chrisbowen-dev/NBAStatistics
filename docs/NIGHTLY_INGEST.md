# Nightly Ingest Script

**File:** `python-api/scripts/nightly_ingest.py`

This script fetches all NBA team and player data from NBA.com and upserts it into
MongoDB Atlas. It must run from a machine with a residential IP address — NBA.com blocks
requests from cloud datacenter IPs (AWS, Render, Railway, etc.), which is why ingestion
happens from a home machine rather than the cloud. See [`PROJECT_PLAN.md`](./PROJECT_PLAN.md)
for how this fits into the overall architecture.

---

## What It Does

The script runs two stages in sequence: teams first, then players. Every NBA.com network
call is followed by a one-second pause to respect NBA.com's rate limit and avoid
temporary IP bans, so a full refresh takes roughly **10–20 minutes** (~30 teams and
~500 active players).

### Stage 1: Teams

For each of the 30 NBA teams (sourced from static nba_api data — no network call):

1. **TeamDetails** — franchise metadata: arena, owner, head coach, conference/division rank
2. **CommonTeamRoster** — current roster (player names, jersey numbers, positions, ages)
3. **TeamDashboardByGeneralSplits** — current season stats: wins, losses, win %, points,
   rebounds, assists, net rating

Each team's data is combined into a single document and upserted into the `teams`
collection in MongoDB Atlas, keyed on `team.id`, with `lastUpdated` set to the current
UTC time. If an individual team fails (e.g. a timeout), it is logged and skipped — the
rest continue normally.

### Stage 2: Players

For each currently active player (sourced from static nba_api data — no network call):

1. **CommonPlayerInfo** — biographical data: full name, team, position, jersey number,
   height, weight, birthdate, country, draft info
2. **PlayerCareerStats** (per-game averages) — one row per season played, plus a derived
   `currentSeasonStats` from the most recent entry

Each player's data is combined into a single document and upserted into the `players`
collection, keyed on `player.id`, with `lastUpdated` set to the current UTC time.
Individual failures are logged and skipped.

### MongoDB writes

Both stages batch all successful documents into a single `bulk_write` call at the end,
minimizing round-trips to Atlas.

---

## Scheduling

In production this script runs automatically once a night (around midnight) from a
home machine on a residential IP, keeping MongoDB Atlas fresh so the deployed app always
has current data. The cloud app itself never runs this script — it only reads the data
the script produces.
