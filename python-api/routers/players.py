"""
Players router — wraps nba_api player endpoints.

Endpoints:
  GET /players/search?name=   Search active players by name (static, no network call).
  GET /players/{player_id}    Full player bio + career stats (2 network calls, rate-limited).
"""

import time

from fastapi import APIRouter, HTTPException
from nba_api.stats.static import players
from nba_api.stats.endpoints import commonplayerinfo, playercareerstats

router = APIRouter(prefix="/players", tags=["players"])

_MAX_RESULTS = 50


@router.get("/search")
def search_players(name: str = ""):
    """
    Search active players by full name (case-insensitive substring match).

    - No ``name`` param: returns the first 50 active players.
    - With ``name``: returns up to 50 players whose full_name contains the
      query string (case-insensitive).

    Uses ``nba_api.stats.static.players`` — no network call to NBA.com.
    """
    all_active = players.get_active_players()

    if not name:
        # No query — return the first 50 active players as a sensible default.
        return all_active[:_MAX_RESULTS]

    query = name.lower()
    matches = [
        p for p in all_active
        if query in p["full_name"].lower()
    ]
    return matches[:_MAX_RESULTS]


@router.get("/{player_id}")
def get_player(player_id: int):
    """
    Fetch a single player's biographical info and full career stats.

    Makes two sequential network calls to NBA.com (CommonPlayerInfo, then
    PlayerCareerStats) with a 1-second sleep between them to respect the
    unofficial 1 req/sec rate limit.

    Returns:
        {
          "info":        dict  — CommonPlayerInfo result (single row),
          "careerStats": list  — one dict per regular-season season.
        }

    Raises:
        HTTPException 404 if the player_id is not found or the API call fails.
    """
    try:
        # --- Call 1: biographical info ---
        info_endpoint = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
        time.sleep(1)  # rate limit: 1 req/sec

        # --- Call 2: career stats ---
        career_endpoint = playercareerstats.PlayerCareerStats(player_id=player_id)
        # No trailing sleep needed here; the caller controls pacing between
        # consecutive endpoint-level requests.

        # get_normalized_dict() returns a dict keyed by result-set name.
        # "CommonPlayerInfo" is the primary result set; it is a list with
        # exactly one row for a valid player.
        info_data = info_endpoint.get_normalized_dict()["CommonPlayerInfo"][0]

        # "SeasonTotalsRegularSeason" is the per-season regular-season log.
        career_data = career_endpoint.get_normalized_dict()["SeasonTotalsRegularSeason"]

        return {
            "info": info_data,
            "careerStats": career_data,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=404,
            detail=f"Player {player_id} not found or NBA.com request failed: {exc}",
        )
