"""
Teams router — wraps nba_api team endpoints.

Endpoints:
  GET /teams                  All 30 NBA teams (static, no network call).
  GET /teams/{team_id}        Team details, current roster, and season stats
                              (3 network calls, rate-limited).
"""

import time

from fastapi import APIRouter, HTTPException
from nba_api.stats.static import teams
from nba_api.stats.endpoints import (
    teamdetails,
    commonteamroster,
    teamdashboardbygeneralsplits,
)

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("")
def get_all_teams():
    """
    Return all 30 NBA teams as a list of dicts.

    Uses ``nba_api.stats.static.teams`` — no network call to NBA.com.

    Each team dict contains:
        id, full_name, abbreviation, nickname, city, state, year_founded.
    """
    return teams.get_teams()


@router.get("/{team_id}")
def get_team(team_id: int):
    """
    Fetch a single team's details, current roster, and season dashboard stats.

    Makes three sequential network calls to NBA.com with a 1-second sleep
    between each to respect the unofficial 1 req/sec rate limit:
      1. TeamDetails          — franchise background info.
      2. CommonTeamRoster     — current season roster.
      3. TeamDashboardByGeneralSplits — aggregated season stats.

    Returns:
        {
          "details": dict  — TeamBackground result set (single row),
          "roster":  list  — one dict per player on the current roster,
          "stats":   dict  — OverallTeamDashboard result set (single row).
        }

    Raises:
        HTTPException 404 if the team_id is invalid or any NBA.com call fails.
    """
    try:
        # --- Call 1: franchise/background details ---
        details_endpoint = teamdetails.TeamDetails(team_id=team_id)
        time.sleep(1)  # rate limit: 1 req/sec

        # --- Call 2: current roster ---
        roster_endpoint = commonteamroster.CommonTeamRoster(team_id=team_id)
        time.sleep(1)  # rate limit: 1 req/sec

        # --- Call 3: season dashboard stats ---
        stats_endpoint = teamdashboardbygeneralsplits.TeamDashboardByGeneralSplits(
            team_id=team_id
        )
        # No trailing sleep; caller controls pacing between endpoint requests.

        # get_normalized_dict() keys mirror the result-set names from the API.
        # "TeamBackground" is the primary result set for TeamDetails — a single
        # row containing arena, owner, head coach, etc.
        details_data = details_endpoint.get_normalized_dict()["TeamBackground"][0]

        # "CommonTeamRoster" is the list of current players.
        # Columns include: PLAYER_ID, PLAYER, NUM, POSITION, HEIGHT, WEIGHT,
        # BIRTH_DATE, AGE, EXP, SCHOOL, TeamID, SEASON, LeagueID.
        roster_data = roster_endpoint.get_normalized_dict()["CommonTeamRoster"]

        # "OverallTeamDashboard" is the season-aggregate stats row.
        # Columns include wins/losses, PTS, REB, AST, net rating, etc.
        stats_data = stats_endpoint.get_normalized_dict()["OverallTeamDashboard"][0]

        return {
            "details": details_data,
            "roster": roster_data,
            "stats": stats_data,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=404,
            detail=f"Team {team_id} not found or NBA.com request failed: {exc}",
        )
