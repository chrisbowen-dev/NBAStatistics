"""
nightly_ingest.py -- NBA Statistics nightly data ingestion script.

Fetches all 30 NBA team and active-player data via nba_api and upserts
into MongoDB Atlas (database: nba_stats). Designed to run on a residential-
IP machine via Windows Task Scheduler or Raspberry Pi cron so that the
deployed Express app never needs to contact NBA.com from cloud IPs.

Rate limit: 1 request per second (time.sleep(1) between every network call).
"""

import os
import time
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne

from nba_api.stats.static import players, teams
from nba_api.stats.endpoints import (
    commonplayerinfo,
    playercareerstats,
    commonteamroster,
    teamdashboardbygeneralsplits,
)

# ---------------------------------------------------------------------------
# Configuration -- load MONGODB_URI from python-api/.env
# ---------------------------------------------------------------------------

# Resolve the .env path relative to this file's location so the script works
# whether invoked from the repo root, python-api/, or python-api/scripts/.
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_DOTENV_PATH = os.path.join(_SCRIPT_DIR, "..", ".env")
load_dotenv(dotenv_path=_DOTENV_PATH)

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise EnvironmentError(
        "MONGODB_URI is not set. Make sure python-api/.env exists and contains MONGODB_URI."
    )

# ---------------------------------------------------------------------------
# MongoDB connection
# ---------------------------------------------------------------------------

_mongo_client = MongoClient(MONGODB_URI)
db = _mongo_client["nba_stats"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now_utc() -> datetime:
    """Return a timezone-aware UTC datetime (required for proper MongoDB indexing)."""
    return datetime.now(timezone.utc)


def _log(msg: str) -> None:
    """Print a timestamped log line (appears in Task Scheduler / cron log files)."""
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{ts}] {msg}", flush=True)


# ---------------------------------------------------------------------------
# ingest_teams
# ---------------------------------------------------------------------------

def ingest_teams() -> None:
    """
    For all 30 static NBA teams:
      1. Fetch current roster via CommonTeamRoster (1 network call).
      2. Fetch season stats via TeamDashboardByGeneralSplits (1 network call).
      3. Build an upsert document keyed on team["id"] and bulk_write to
         the "teams" collection.

    Rate limit: time.sleep(1) between every network call.
    Per-team try/except so one failure does not abort the entire run.
    """
    _log("=== ingest_teams: starting ===")

    all_teams = teams.get_teams()  # static -- no network call
    _log(f"  Found {len(all_teams)} teams in static data.")

    ops = []
    success_count = 0
    error_count = 0

    for team in all_teams:
        team_id = team["id"]
        team_name = team["full_name"]

        try:
            # --- Fetch roster ---
            _log(f"  [{team_name}] Fetching roster (CommonTeamRoster)...")
            roster_endpoint = commonteamroster.CommonTeamRoster(team_id=team_id)
            time.sleep(1)  # rate limit

            # get_normalized_dict() key confirmed from installed source:
            # commonteamroster.py expected_data key = "CommonTeamRoster"
            roster_data = roster_endpoint.get_normalized_dict()["CommonTeamRoster"]

            # --- Fetch season stats ---
            _log(f"  [{team_name}] Fetching season stats (TeamDashboardByGeneralSplits)...")
            stats_endpoint = teamdashboardbygeneralsplits.TeamDashboardByGeneralSplits(
                team_id=team_id
            )
            time.sleep(1)  # rate limit

            # get_normalized_dict() key confirmed from installed source:
            # teamdashboardbygeneralsplits.py expected_data key = "OverallTeamDashboard"
            # Returns a list; [0] is the single overall-season summary row.
            overall_stats_list = stats_endpoint.get_normalized_dict()["OverallTeamDashboard"]
            overall_stats = overall_stats_list[0] if overall_stats_list else {}

            # --- Build upsert document ---
            # Spread static team fields (id, full_name, abbreviation, nickname,
            # city, state, year_founded) then overlay fetched data.
            doc = {
                **team,
                "roster": roster_data,
                "currentSeasonStats": overall_stats,
                "lastUpdated": _now_utc(),
            }

            ops.append(
                UpdateOne(
                    {"id": team_id},
                    {"$set": doc},
                    upsert=True,
                )
            )

            success_count += 1
            _log(f"  [{team_name}] OK -- {len(roster_data)} roster players fetched.")

        except Exception as exc:
            error_count += 1
            _log(f"  [ERROR] {team_name} (id={team_id}): {exc}")

    # Bulk write all successful ops in one round-trip.
    if ops:
        result = db.teams.bulk_write(ops)
        _log(
            f"=== ingest_teams: complete -- "
            f"{success_count} succeeded, {error_count} failed, "
            f"{result.upserted_count} inserted, {result.modified_count} updated. ==="
        )
    else:
        _log("=== ingest_teams: complete -- no operations to write. ===")


# ---------------------------------------------------------------------------
# ingest_players
# ---------------------------------------------------------------------------

def ingest_players() -> None:
    """
    For all currently active players:
      1. Fetch biographical info via CommonPlayerInfo (1 network call).
      2. Fetch career stats via PlayerCareerStats (1 network call).
      3. Build an upsert document keyed on player["id"] and bulk_write to
         the "players" collection.

    Rate limit: time.sleep(1) between every network call.
    Per-player try/except so one failure does not abort the entire run.

    Estimated runtime: ~500 active players x 2 calls x 1 sec = ~17 minutes.
    """
    _log("=== ingest_players: starting ===")

    active = players.get_active_players()  # static -- no network call
    _log(f"  Found {len(active)} active players in static data.")

    ops = []
    success_count = 0
    error_count = 0

    for idx, player in enumerate(active, start=1):
        player_id = player["id"]
        player_name = player["full_name"]

        try:
            _log(
                f"  [{idx}/{len(active)}] {player_name} -- "
                f"Fetching bio (CommonPlayerInfo)..."
            )
            info_endpoint = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
            time.sleep(1)  # rate limit

            # get_normalized_dict() key confirmed from installed source:
            # commonplayerinfo.py expected_data key = "CommonPlayerInfo"
            # Returns a list; [0] is the single player row.
            info_list = info_endpoint.get_normalized_dict()["CommonPlayerInfo"]
            player_info = info_list[0] if info_list else {}

            _log(
                f"  [{idx}/{len(active)}] {player_name} -- "
                f"Fetching career stats (PlayerCareerStats)..."
            )
            career_endpoint = playercareerstats.PlayerCareerStats(
                player_id=player_id,
                per_mode36="PerGame",  # per-game averages are most useful for display
            )
            time.sleep(1)  # rate limit

            # get_normalized_dict() key confirmed from installed source:
            # playercareerstats.py expected_data key = "SeasonTotalsRegularSeason"
            # Returns a list of per-season rows (one row per season/team stint).
            career_data = career_endpoint.get_normalized_dict()["SeasonTotalsRegularSeason"]

            # Derive current-season stats: last entry in the regular-season list
            # (entries are ordered oldest-to-newest by the API).
            current_season_stats = career_data[-1] if career_data else {}

            # --- Build upsert document ---
            # Spread static player fields (id, full_name, first_name,
            # last_name, is_active) then overlay fetched data.
            doc = {
                **player,
                "info": player_info,
                "currentSeasonStats": current_season_stats,
                "careerStats": career_data,
                "lastUpdated": _now_utc(),
            }

            ops.append(
                UpdateOne(
                    {"id": player_id},
                    {"$set": doc},
                    upsert=True,
                )
            )

            success_count += 1
            _log(
                f"  [{idx}/{len(active)}] {player_name} OK -- "
                f"{len(career_data)} career seasons fetched."
            )

        except Exception as exc:
            error_count += 1
            _log(f"  [ERROR] {player_name} (id={player_id}): {exc}")

    # Bulk write all successful ops in one round-trip.
    if ops:
        result = db.players.bulk_write(ops)
        _log(
            f"=== ingest_players: complete -- "
            f"{success_count} succeeded, {error_count} failed, "
            f"{result.upserted_count} inserted, {result.modified_count} updated. ==="
        )
    else:
        _log("=== ingest_players: complete -- no operations to write. ===")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    start_time = _now_utc()
    _log(f"Nightly ingest started at {start_time.isoformat()}")

    ingest_teams()
    ingest_players()

    end_time = _now_utc()
    elapsed = (end_time - start_time).total_seconds()
    _log(
        f"Nightly ingest finished at {end_time.isoformat()} "
        f"(elapsed: {elapsed:.0f}s / {elapsed / 60:.1f}m)"
    )
