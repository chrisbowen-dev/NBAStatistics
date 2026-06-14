# nba_api — Deep Dive Documentation
**Library:** `nba_api` by swar  
**GitHub:** [github.com/swar/nba_api](https://github.com/swar/nba_api)  
**PyPI:** [pypi.org/project/nba_api](https://pypi.org/project/nba_api/)  
**Current Version:** 1.11.4 (as of February 2026)  
**License:** MIT (free, open source)

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Installation & Setup](#installation--setup)
3. [Core Concepts](#core-concepts)
4. [Static Data — Players & Teams](#static-data--players--teams)
5. [Player Endpoints](#player-endpoints)
6. [Team Endpoints](#team-endpoints)
7. [League-Wide Endpoints](#league-wide-endpoints)
8. [Advanced Stats](#advanced-stats)
9. [Player Tracking Data](#player-tracking-data)
10. [Shot Charts](#shot-charts)
11. [Play-by-Play](#play-by-play)
12. [Playoff Data](#playoff-data)
13. [Live Game Data](#live-game-data)
14. [Common Parameters Reference](#common-parameters-reference)
15. [Output Formats](#output-formats)
16. [Rate Limiting & NBA.com Blocking](#rate-limiting--nbacom-blocking)
17. [Practical App Patterns](#practical-app-patterns)
18. [Full Endpoint Catalog](#full-endpoint-catalog)

---

## How It Works

NBA.com serves all of its own statistics pages by calling a large set of undocumented internal JSON endpoints hosted at `stats.nba.com`. Every table, chart, and leaderboard you see on NBA.com is populated by these endpoints. `nba_api` reverse-engineered and mapped these endpoints, then wrapped them in a clean Python interface.

Because the endpoints are NBA.com's own internal infrastructure, the data is:
- The exact same data you see on NBA.com
- Updated on the same schedule as NBA.com
- Free to access with no API key

The library sends HTTP requests with the same headers a browser would send, parses the JSON response, and returns the data in multiple formats (pandas DataFrame, JSON string, or Python dict).

---

## Installation & Setup

### Requirements
- Python 3.10 or higher
- `requests`
- `numpy`
- `pandas` (optional but highly recommended for working with DataFrames)

### Install
```bash
pip install nba_api
```

### Verify installation
```python
from nba_api.stats.static import players
all_players = players.get_players()
print(f"Total players in database: {len(all_players)}")
```

---

## Core Concepts

### Two Sides of the Library

`nba_api` is split into two main parts:

| Module | Purpose |
|---|---|
| `nba_api.stats.static` | Static lookup data — player IDs, team IDs, names. Instant, no network call needed. |
| `nba_api.stats.endpoints` | Live stat endpoints — makes an HTTP request to NBA.com each time you call one. |

### The IDs You Need to Know

Almost everything in nba_api is keyed by numeric IDs. You'll use the static module to look these up.

- **Player ID** — unique per player, consistent across their entire career
- **Team ID** — unique per franchise
- **Game ID** — 10-digit string like `'0022300001'` (the leading `00` is the league; `23` is the season year; the rest is the game number)
- **Season** — formatted as `'2024-25'` for the 2024-2025 season, or just `'2024'` in some endpoints

### Data Comes Back in Named Result Sets

Each endpoint returns one or more "result sets." A result set is essentially a named table with column headers and rows. You access them either by index or by their attribute name on the endpoint object.

---

## Static Data — Players & Teams

Static data is stored locally in the library itself — no network call, instant response. Use this to look up IDs before making endpoint calls.

### Players

```python
from nba_api.stats.static import players

# Get every player ever (active and historical)
all_players = players.get_players()
# Returns a list of dicts: [{'id': 2544, 'full_name': 'LeBron James', 'first_name': 'LeBron',
#                             'last_name': 'James', 'is_active': True}, ...]

# Get only currently active players
active_players = players.get_active_players()

# Search by name
lebron = players.find_players_by_full_name('LeBron James')
# Returns a list (usually one item): [{'id': 2544, 'full_name': 'LeBron James', ...}]

# Partial name search (regex supported)
james_players = players.find_players_by_last_name('james')
bron_players = players.find_players_by_first_name('lebron')

# Get a specific player by ID
player = players.find_player_by_id(2544)

# Practical pattern: get an ID from a name
player_id = players.find_players_by_full_name('Nikola Jokic')[0]['id']
# player_id = 203999
```

### Teams

```python
from nba_api.stats.static import teams

# All 30 NBA teams
all_teams = teams.get_teams()
# Returns: [{'id': 1610612737, 'full_name': 'Atlanta Hawks', 'abbreviation': 'ATL',
#             'nickname': 'Hawks', 'city': 'Atlanta', 'state': 'Georgia', 'year_founded': 1949}, ...]

# Search by name / abbreviation / nickname / city
denver = teams.find_teams_by_full_name('Denver Nuggets')
nuggets = teams.find_teams_by_nickname('Nuggets')
den = teams.find_teams_by_abbreviation('DEN')
colorado = teams.find_teams_by_state('Colorado')

# Get one team by ID
team = teams.find_team_by_id(1610612743)

# Practical pattern
team_id = teams.find_teams_by_abbreviation('GSW')[0]['id']
# team_id = 1610612744
```

---

## Player Endpoints

All player endpoints require a `player_id`. Get this from the static module above.

### Career Stats

The most commonly used player endpoint. Returns a player's cumulative stats broken down by season.

```python
from nba_api.stats.endpoints import playercareerstats

career = playercareerstats.PlayerCareerStats(
    player_id='203999',  # Nikola Jokić
    per_mode36='PerGame'  # or 'Totals' or 'Per36'
)

# Regular season, season by season
df = career.season_totals_regular_season.get_data_frame()
# Columns: PLAYER_ID, SEASON_ID, LEAGUE_ID, TEAM_ID, TEAM_ABBREVIATION,
#          PLAYER_AGE, GP, GS, MIN, FGM, FGA, FG_PCT, FG3M, FG3A, FG3_PCT,
#          FTM, FTA, FT_PCT, OREB, DREB, REB, AST, STL, BLK, TOV, PF, PTS

# Career totals (single summary row)
df_totals = career.career_totals_regular_season.get_data_frame()

# Playoff stats
df_playoffs = career.season_totals_post_season.get_data_frame()

# Available result sets on this endpoint:
# .season_totals_regular_season
# .career_totals_regular_season
# .season_totals_post_season
# .career_totals_post_season
# .season_totals_all_star_season
# .career_totals_all_star_season
# .season_totals_college_season
# .career_totals_college_season
# .season_rankings_regular_season
# .season_rankings_post_season
```

### Player Game Log

Every game a player played in a given season, with box score stats for each game.

```python
from nba_api.stats.endpoints import playergamelog

gamelog = playergamelog.PlayerGameLog(
    player_id='2544',     # LeBron James
    season='2024-25',
    season_type_all_star='Regular Season'  # or 'Playoffs' or 'Pre Season'
)

df = gamelog.get_data_frames()[0]
# Columns: SEASON_ID, Player_ID, Game_ID, GAME_DATE, MATCHUP, WL,
#          MIN, FGM, FGA, FG_PCT, FG3M, FG3A, FG3_PCT, FTM, FTA, FT_PCT,
#          OREB, DREB, REB, AST, STL, BLK, TOV, PF, PTS, PLUS_MINUS,
#          VIDEO_AVAILABLE
```

### Player Dashboard — General Splits

Aggregated stats broken into various splits (home/away, wins/losses, by month, by period, etc.).

```python
from nba_api.stats.endpoints import playerdashboardbygeneralsplits

dashboard = playerdashboardbygeneralsplits.PlayerDashboardByGeneralSplits(
    player_id='203999',
    season='2024-25',
    measure_type_detailed_defense='Advanced',  # 'Base', 'Advanced', 'Misc', 'Scoring', 'Usage', 'Defense'
    per_mode_simple='PerGame',
    season_type_playoffs='Regular Season'
)

# Available splits (each is a separate result set / DataFrame):
# .overall_player_dashboard         — full season summary
# .location_player_dashboard        — home vs. away
# .wins_losses_player_dashboard     — wins vs. losses
# .month_player_dashboard           — by month
# .pre_post_all_star_player_dashboard
# .starting_position_player_dashboard  — starter vs. bench
# .days_rest_player_dashboard       — by days of rest
```

### Player Dashboard — Game Splits

Stats broken down by game situation.

```python
from nba_api.stats.endpoints import playerdashboardbygamesplits

splits = playerdashboardbygamesplits.PlayerDashboardByGameSplits(
    player_id='203999',
    season='2024-25',
    measure_type_detailed_defense='Advanced'
)

# Result sets:
# .by_half_player_dashboard        — first half vs. second half
# .by_period_player_dashboard      — by quarter
# .by_score_margin_player_dashboard
# .by_actual_margin_player_dashboard
```

### Player Profile

Biographical info and season headline stats.

```python
from nba_api.stats.endpoints import commonplayerinfo

info = commonplayerinfo.CommonPlayerInfo(player_id='203999')

df = info.common_player_info.get_data_frame()
# Columns: PERSON_ID, FIRST_NAME, LAST_NAME, DISPLAY_FIRST_LAST,
#          BIRTHDATE, SCHOOL, COUNTRY, LAST_AFFILIATION,
#          HEIGHT, WEIGHT, SEASON_EXP, JERSEY, POSITION,
#          ROSTERSTATUS, TEAM_ID, TEAM_NAME, TEAM_ABBREVIATION,
#          TEAM_CODE, FROM_YEAR, TO_YEAR, DLEAGUE_FLAG, NBA_FLAG,
#          DRAFT_YEAR, DRAFT_ROUND, DRAFT_NUMBER
```

### Player vs. Player Comparison

Head-to-head statistical comparison between two players.

```python
from nba_api.stats.endpoints import playervsplayer

pvp = playervsplayer.PlayerVsPlayer(
    player_id='203999',         # Jokić
    vs_player_id='1629029',     # Luka Dončić
    season='2024-25'
)
```

---

## Team Endpoints

### Team Game Log

Every game a team played in a season.

```python
from nba_api.stats.endpoints import teamgamelog

gamelog = teamgamelog.TeamGameLog(
    team_id='1610612743',   # Denver Nuggets
    season='2024-25',
    season_type_all_star='Regular Season'
)

df = gamelog.get_data_frames()[0]
# Columns: Team_ID, Game_ID, GAME_DATE, MATCHUP, WL, W, L, W_PCT,
#          MIN, FGM, FGA, FG_PCT, FG3M, FG3A, FG3_PCT, FTM, FTA, FT_PCT,
#          OREB, DREB, REB, AST, STL, BLK, TOV, PF, PTS
```

### Team Dashboard — General Splits

```python
from nba_api.stats.endpoints import teamdashboardbygeneralsplits

dashboard = teamdashboardbygeneralsplits.TeamDashboardByGeneralSplits(
    team_id='1610612744',   # Golden State Warriors
    season='2024-25',
    measure_type_detailed_defense='Advanced'
)
```

### Team Year-by-Year Stats

Historical season stats for a franchise going back decades.

```python
from nba_api.stats.endpoints import teamyearbyyearstats

history = teamyearbyyearstats.TeamYearByYearStats(
    team_id='1610612744',
    season_type_all_star='Regular Season',
    per_mode_simple='PerGame'
)

df = history.team_stats.get_data_frame()
```

### Team Details

Franchise info, arena, coaches, ownership.

```python
from nba_api.stats.endpoints import teamdetails

details = teamdetails.TeamDetails(team_id='1610612744')
# Result sets: .team_background, .team_history, .team_social_sites,
#              .team_awards_championships, .team_awards_conf, .team_awards_div,
#              .team_hof, .team_retired
```

### Common Team Roster

Current roster for a team.

```python
from nba_api.stats.endpoints import commonteamroster

roster = commonteamroster.CommonTeamRoster(
    team_id='1610612744',
    season='2024-25'
)

df = roster.common_team_roster.get_data_frame()
# Columns: TeamID, SEASON, LeagueID, PLAYER, NICKNAME, PLAYER_SLUG,
#          NUM, POSITION, HEIGHT, WEIGHT, BIRTH_DATE, AGE,
#          EXP, SCHOOL, PLAYER_ID
```

---

## League-Wide Endpoints

These return stats for all players or all teams in the league, useful for leaderboards and rankings.

### League Player Stats — The Main Workhorse

This is the most versatile endpoint. By changing `measure_type`, you switch between traditional, advanced, tracking-based, and other stat categories all from one endpoint.

```python
from nba_api.stats.endpoints import leaguedashplayerstats

# --- TRADITIONAL STATS ---
traditional = leaguedashplayerstats.LeagueDashPlayerStats(
    season='2024-25',
    measure_type_detailed_defense='Base',
    per_mode_simple='PerGame',
    season_type_all_star='Regular Season'
)
df = traditional.league_dash_player_stats.get_data_frame()
# Key columns: PLAYER_NAME, TEAM_ABBREVIATION, AGE, GP, MIN, PTS,
#              REB, AST, STL, BLK, TOV, FG_PCT, FG3_PCT, FT_PCT, PLUS_MINUS

# --- ADVANCED STATS ---
advanced = leaguedashplayerstats.LeagueDashPlayerStats(
    season='2024-25',
    measure_type_detailed_defense='Advanced',
    per_mode_simple='PerGame'
)
df_adv = advanced.league_dash_player_stats.get_data_frame()
# Key columns: PLAYER_NAME, OFF_RATING, DEF_RATING, NET_RATING,
#              AST_PCT, AST_TO, AST_RATIO, OREB_PCT, DREB_PCT, REB_PCT,
#              TM_TOV_PCT, EFG_PCT, TS_PCT, USG_PCT, PACE, PIE

# --- USAGE STATS ---
usage = leaguedashplayerstats.LeagueDashPlayerStats(
    season='2024-25',
    measure_type_detailed_defense='Usage',
    per_mode_simple='PerGame'
)
# Key columns: USG_PCT, PCT_FGM, PCT_FGA, PCT_FG3M, PCT_FG3A,
#              PCT_FTM, PCT_FTA, PCT_OREB, PCT_DREB, PCT_REB,
#              PCT_AST, PCT_TOV, PCT_STL, PCT_BLK, PCT_BLKA, PCT_PF, PCT_PFD, PCT_PTS

# --- FOUR FACTORS ---
four_factors = leaguedashplayerstats.LeagueDashPlayerStats(
    season='2024-25',
    measure_type_detailed_defense='Four Factors'
)
# Key columns: EFG_PCT, FTA_RATE, TM_TOV_PCT, OREB_PCT (Dean Oliver's Four Factors)

# --- SCORING BREAKDOWN ---
scoring = leaguedashplayerstats.LeagueDashPlayerStats(
    season='2024-25',
    measure_type_detailed_defense='Scoring'
)
# Key columns: PCT_FGA_2PT, PCT_FGA_3PT, PCT_PTS_2PT, PCT_PTS_MID_RANGE,
#              PCT_PTS_3PT, PCT_PTS_FB, PCT_PTS_FT, PCT_PTS_OFF_TOV, PCT_PTS_PAINT

# --- OPPONENT STATS ---
opponent = leaguedashplayerstats.LeagueDashPlayerStats(
    season='2024-25',
    measure_type_detailed_defense='Opponent'
)

# --- DEFENSE ---
defense = leaguedashplayerstats.LeagueDashPlayerStats(
    season='2024-25',
    measure_type_detailed_defense='Defense'
)
```

**Measure Type Values:**
- `'Base'` — Traditional stats (PTS, REB, AST, etc.)
- `'Advanced'` — Efficiency stats (ORtg, DRtg, TS%, USG%, PIE, etc.)
- `'Misc'` — Miscellaneous (points off turnovers, second chance points, etc.)
- `'Four Factors'` — Dean Oliver's Four Factors
- `'Scoring'` — Shot type breakdown (paint, midrange, 3PT, etc.)
- `'Opponent'` — Stats allowed
- `'Usage'` — Share of team possessions used
- `'Defense'` — Defensive metrics

### League Team Stats

Same structure as player stats, but for teams.

```python
from nba_api.stats.endpoints import leaguedashteamstats

team_stats = leaguedashteamstats.LeagueDashTeamStats(
    season='2024-25',
    measure_type_detailed_defense='Advanced',
    per_mode_simple='PerGame'
)
df = team_stats.league_dash_team_stats.get_data_frame()
```

### League Leaders

Ranked leaderboard for a specific stat category.

```python
from nba_api.stats.endpoints import leagueleaders

leaders = leagueleaders.LeagueLeaders(
    season='2024-25',
    stat_category_abbreviation='PTS',  # 'AST', 'REB', 'STL', 'BLK', 'FG_PCT', etc.
    per_mode48='PerGame',
    season_type_all_star='Regular Season'
)
df = leaders.league_leaders.get_data_frame()
```

### League Standings

Current win-loss records and playoff seeding.

```python
from nba_api.stats.endpoints import leaguestandings

standings = leaguestandings.LeagueStandings(
    season='2024-25',
    season_type='Regular Season'
)
df = standings.standings.get_data_frame()
# Columns: TeamID, TeamCity, TeamName, Conference, Division, Record, WinPct,
#          HomeRecord, RoadRecord, L10, CurrentStreak, ConferenceRank, PlayoffRank
```

### Lineup Stats

Stats for specific lineup combinations (5-man units, 2-man combos, etc.).

```python
from nba_api.stats.endpoints import leaguedashlineups

lineups = leaguedashlineups.LeagueDashLineups(
    season='2024-25',
    measure_type_detailed_defense='Advanced',
    per_mode_simple='Per100Possessions',
    group_quantity=5    # 2, 3, 4, or 5 player lineup combos
)
df = lineups.league_dash_lineups.get_data_frame()
# Shows every lineup's OffRtg, DefRtg, NetRtg, Pace, eFG%, TS%, etc.
```

---

## Advanced Stats

This is where `nba_api` really earns its place. The advanced stats available go well beyond what most free APIs offer.

### Player Advanced Dashboard

```python
from nba_api.stats.endpoints import playerdashboardbygeneralsplits

adv = playerdashboardbygeneralsplits.PlayerDashboardByGeneralSplits(
    player_id='203999',  # Jokić
    season='2024-25',
    measure_type_detailed_defense='Advanced',
    per_mode_simple='PerGame'
)

df = adv.overall_player_dashboard.get_data_frame()
```

**Advanced columns available:**
| Column | Meaning |
|---|---|
| `OFF_RATING` | Points scored per 100 possessions |
| `DEF_RATING` | Points allowed per 100 possessions |
| `NET_RATING` | OffRtg minus DefRtg |
| `AST_PCT` | % of teammate FGM assisted while on court |
| `AST_TO` | Assist-to-turnover ratio |
| `AST_RATIO` | Assists per 100 possessions |
| `OREB_PCT` | Offensive rebound rate |
| `DREB_PCT` | Defensive rebound rate |
| `REB_PCT` | Total rebound rate |
| `TM_TOV_PCT` | Team turnover rate |
| `EFG_PCT` | Effective Field Goal % (weights 3s) |
| `TS_PCT` | True Shooting % (accounts for 3s and FTs) |
| `USG_PCT` | Usage rate (% of team possessions used) |
| `PACE` | Possessions per 48 minutes |
| `PIE` | Player Impact Estimate (NBA's all-in-one rating) |
| `POSS` | Estimated possessions used |

### Box Score Advanced — Single Game

Per-game advanced stats for every player in a specific game.

```python
from nba_api.stats.endpoints import boxscoreadvancedv3

boxscore = boxscoreadvancedv3.BoxScoreAdvancedV3(game_id='0022300001')

df_players = boxscore.player_stats.get_data_frame()
# Columns: gameId, teamId, teamCity, teamName, teamTricode,
#          personId, firstName, familyName, position, minutesCalculated,
#          estimatedOffensiveRating, estimatedDefensiveRating, estimatedNetRating,
#          assistPercentage, assistToTurnover, assistRatio,
#          offensiveReboundPercentage, defensiveReboundPercentage, reboundPercentage,
#          turnoverRatio, effectiveFieldGoalPercentage, trueShootingPercentage,
#          usagePercentage, estimatedUsagePercentage, estimatedPace, pace,
#          pacePer40, possessions, pie

df_teams = boxscore.team_stats.get_data_frame()
```

### Box Score — Four Factors

```python
from nba_api.stats.endpoints import boxscorefourfactorsv3

ff = boxscorefourfactorsv3.BoxScoreFourFactorsV3(game_id='0022300001')
df = ff.sql_teams.get_data_frame()
# Columns: EFG_PCT, FTA_RATE, TM_TOV_PCT, OREB_PCT (the Four Factors)
```

### Clutch Stats

Advanced stats specifically in clutch situations (last 5 minutes, within 5 points).

```python
from nba_api.stats.endpoints import leaguedashplayerclutch

clutch = leaguedashplayerclutch.LeagueDashPlayerClutch(
    season='2024-25',
    measure_type_detailed_defense='Advanced',
    per_mode_simple='PerGame',
    clutch_time='Last 5 Minutes',   # 'Last 1 Minute', 'Last 2 Minutes', etc.
    ahead_behind='Ahead or Behind',
    point_diff=5
)
df = clutch.league_dash_player_clutch.get_data_frame()
```

### Hustle Stats

Non-traditional effort metrics.

```python
from nba_api.stats.endpoints import leaguehustlestatsplayer

hustle = leaguehustlestatsplayer.LeagueHustleStatsPlayer(
    season='2024-25',
    season_type_playoffs='Regular Season'
)
df = hustle.hustle_stats_player.get_data_frame()
# Columns: PLAYER_NAME, TEAM_ABBREVIATION, G, MIN,
#          CONTESTED_SHOTS, CONTESTED_SHOTS_2PT, CONTESTED_SHOTS_3PT,
#          DEFLECTIONS, CHARGES_DRAWN, SCREEN_ASSISTS, SCREEN_AST_PTS,
#          OFF_LOOSE_BALLS_RECOVERED, DEF_LOOSE_BALLS_RECOVERED,
#          BOX_OUTS, OFF_BOX_OUTS, DEF_BOX_OUTS
```

---

## Player Tracking Data

Player tracking data comes from the cameras installed in NBA arenas. It measures movement, touches, and spatial positioning — stats you won't find in any traditional box score. Access this via `LeagueDashPtStats` with different `pt_measure_type` values.

```python
from nba_api.stats.endpoints import leaguedashptstats

# Common pattern — swap pt_measure_type for each category:
tracking = leaguedashptstats.LeagueDashPtStats(
    season='2024-25',
    player_or_team='Player',        # or 'Team'
    pt_measure_type='SpeedDistance', # see table below
    per_mode_simple='PerGame',
    season_type_all_star='Regular Season'
)
df = tracking.league_dash_pt_stats.get_data_frame()
```

### Tracking Stat Categories (`pt_measure_type` values)

| Value | What it measures |
|---|---|
| `'SpeedDistance'` | Miles per hour (avg speed), distance traveled |
| `'Rebounding'` | Rebound chances, contested rebounds, rebound distance |
| `'Possessions'` | Touches, front court touches, time of possession |
| `'CatchShoot'` | Catch-and-shoot FGA, FGM, FG% |
| `'PullUpShot'` | Pull-up dribble-shot FGA, FGM, FG% |
| `'Defense'` | Defensive matchups: FGA defended, FG% allowed, DFGM |
| `'Drives'` | Drive frequency, drive FGA, drive AST, drive TO |
| `'Passing'` | Passes made/received, assists, potential assists, AST pts |
| `'ElbowTouch'` | Touches at the elbow, passes, shots, FG% from elbow |
| `'PostTouch'` | Post touches, passes, shots, FG% from the post |
| `'PaintTouch'` | Paint touches, passes, shots, FG% from paint |
| `'Efficiency'` | Points per touch, points per possession |

### Example: Who drives the ball the most?

```python
drives = leaguedashptstats.LeagueDashPtStats(
    season='2024-25',
    player_or_team='Player',
    pt_measure_type='Drives',
    per_mode_simple='PerGame'
)
df = drives.league_dash_pt_stats.get_data_frame()
# Columns: PLAYER_NAME, TEAM_ABBREVIATION, GP, MIN,
#          DRIVES, DRIVE_FGM, DRIVE_FGA, DRIVE_FG_PCT,
#          DRIVE_FTM, DRIVE_FTA, DRIVE_FT_PCT,
#          DRIVE_PTS, DRIVE_PTS_PCT, DRIVE_PASSES, DRIVE_PASSES_PCT,
#          DRIVE_AST, DRIVE_AST_PCT, DRIVE_TOV, DRIVE_TOV_PCT, DRIVE_PF, DRIVE_PF_PCT
```

### Example: Passing metrics

```python
passing = leaguedashptstats.LeagueDashPtStats(
    season='2024-25',
    player_or_team='Player',
    pt_measure_type='Passing',
    per_mode_simple='PerGame'
)
df = passing.league_dash_pt_stats.get_data_frame()
# Columns: PLAYER_NAME, GP, MIN, PASSES_MADE, PASSES_RECEIVED,
#          AST, SECONDARY_AST, POTENTIAL_AST, AST_PTS_CREATED,
#          AST_ADJ, AST_TO_PASS_PCT, AST_TO_PASS_PCT_ADJ
```

---

## Shot Charts

Shot chart data gives you the X/Y coordinates and outcome of every shot attempt. This is excellent for visualizations.

```python
from nba_api.stats.endpoints import shotchartdetail

shots = shotchartdetail.ShotChartDetail(
    player_id='203999',     # Jokić — use 0 for all players
    team_id='1610612743',   # Denver Nuggets — required even for player queries
    season_type_all_star='Regular Season',
    season_nullable='2024-25',
    context_measure_simple='FGA'  # 'FGA', 'FGM', 'FG3A', 'FG3M', 'FTA', 'BLKA'
)

df = shots.get_data_frames()[0]
# Key columns:
# LOC_X — horizontal position on court (-250 to 250, in tenths of a foot)
# LOC_Y — vertical position on court (-52 to 887)
# SHOT_DISTANCE — distance from basket in feet
# SHOT_MADE_FLAG — 1 = made, 0 = missed
# ACTION_TYPE — shot type ('Jump Shot', 'Driving Layup Shot', 'Step Back Jump shot', etc.)
# SHOT_TYPE — '2PT Field Goal' or '3PT Field Goal'
# SHOT_ZONE_BASIC — zone category
# SHOT_ZONE_AREA — side of court
# SHOT_ZONE_RANGE — distance bucket
# GAME_DATE, GAME_ID, HTM, VTM (home/away teams)
# PERIOD, MINUTES_REMAINING, SECONDS_REMAINING (game clock)
# PLAYER_NAME

# Average coordinates: basket is at (0, 0), court is 500 units wide and ~940 tall
```

### Plotting Shot Charts (matplotlib example)

```python
import matplotlib.pyplot as plt

df_made = df[df['SHOT_MADE_FLAG'] == 1]
df_miss = df[df['SHOT_MADE_FLAG'] == 0]

fig, ax = plt.subplots(figsize=(10, 9))
ax.scatter(df_miss['LOC_X'], df_miss['LOC_Y'], c='red', alpha=0.4, s=10, label='Miss')
ax.scatter(df_made['LOC_X'], df_made['LOC_Y'], c='green', alpha=0.4, s=10, label='Made')
ax.set_xlim(-250, 250)
ax.set_ylim(-52, 500)  # half-court
ax.legend()
plt.title("Nikola Jokić Shot Chart — 2024-25")
plt.show()
```

---

## Play-by-Play

Play-by-play data gives you every single event in a game — shots, fouls, timeouts, substitutions — with game clock, score, and player info.

**Note:** `PlayByPlayV2` has been deprecated by NBA.com. Use `PlayByPlayV3`.

```python
from nba_api.stats.endpoints import playbyplayv3

pbp = playbyplayv3.PlayByPlayV3(game_id='0022300001')

df = pbp.get_data_frames()[0]
# Key columns:
# actionNumber — sequential event ID
# clock — game clock (ISO 8601 duration: 'PT05M30.00S' = 5:30 remaining)
# period — quarter (1-4; 5+ for OT)
# teamId, teamTricode
# personId — player who took the action
# playerName, playerNameI
# xLegacy, yLegacy — court coordinates of the shot/event
# shotDistance — shot distance in feet
# shotResult — 'Made' or 'Missed'
# isFieldGoal — 0 or 1
# scoreHome, scoreAway — running score
# pointsTotal — points scored on this play
# location — 'H' or 'A'
# description — text description of the play
# actionType — 'Made Shot', 'Missed Shot', 'Rebound', 'Foul', 'Turnover', 'Substitution', etc.
# subType — more specific (e.g., 'Jump Shot', 'Offensive', etc.)
```

---

## Playoff Data

Playoff statistics are available across several endpoints. The key pattern is using `CommonPlayoffSeries` to get all game IDs, then feeding those into box score or game log endpoints to collect stats — which you can then aggregate per-series, per-round, or across the full playoffs yourself.

### Bracket Structure — `CommonPlayoffSeries`

Returns every game in the playoff bracket: who is home, who is away, and which game number it is within the series.

```python
from nba_api.stats.endpoints import commonplayoffseries

series = commonplayoffseries.CommonPlayoffSeries(
	season='2024-25',
	league_id='00',         # '00' = NBA (always)
	series_id_nullable=''   # leave empty for all series, or pass a specific SERIES_ID
)

df = series.playoff_series.get_data_frame()
# Columns: GAME_ID, HOME_TEAM_ID, VISITOR_TEAM_ID, SERIES_ID, GAME_NUM
```

**Key things to know:**
- One row per game, not per series — a 6-game series gives 6 rows.
- `SERIES_ID` is the glue for grouping games into matchups.
- `GAME_ID` links to every box score and play-by-play endpoint.
- Round number is not a direct column — infer it from `SERIES_ID` or use the `po_round` filter on `LeagueDashPlayerStats`.

### Compiling Stats Across All Playoff Games

The API has no single "stats per series" endpoint — it thinks in games and seasons. The pattern is to collect every game's box score and aggregate yourself.

```python
import time
import pandas as pd
from nba_api.stats.endpoints import commonplayoffseries, boxscoretraditionalv3
from nba_api.stats.static import teams

# Step 1: get all playoff game IDs
series = commonplayoffseries.CommonPlayoffSeries(season='2024-25')
games_df = series.playoff_series.get_data_frame()
game_ids = games_df['GAME_ID'].tolist()
# A full playoff bracket is roughly 80–100 games

# Step 2: loop and collect every player's box score
all_player_games = []

for game_id in game_ids:
	box = boxscoretraditionalv3.BoxScoreTraditionalV3(game_id=str(game_id))
	df = box.player_stats.get_data_frame()
	df['GAME_ID'] = game_id
	all_player_games.append(df)
	time.sleep(1)  # 1 req/sec — ~90 seconds total for a full bracket

# Step 3: one DataFrame with every player in every playoff game
full_df = pd.concat(all_player_games, ignore_index=True)

# Step 4: calculate aggregates
player_totals = full_df.groupby('personId').agg(
	GP=('gameId', 'count'),
	PTS=('points', 'sum'),
	REB=('reboundsTotal', 'sum'),
	AST=('assists', 'sum'),
).reset_index()

player_totals['PPG'] = player_totals['PTS'] / player_totals['GP']
```

### Series-Level Aggregates

Join `SERIES_ID` from `CommonPlayoffSeries` onto your game log rows, then group:

```python
# Merge SERIES_ID into the full player game DataFrame
full_df = full_df.merge(
	games_df[['GAME_ID', 'SERIES_ID']],
	on='GAME_ID',
	how='left'
)

# Per-series averages for a single player
player_df = full_df[full_df['personId'] == 203999]

by_series = player_df.groupby('SERIES_ID').agg(
	GP=('gameId', 'count'),
	PPG=('points', 'mean'),
	RPG=('reboundsTotal', 'mean'),
	APG=('assists', 'mean'),
).reset_index()
```

### Switching Any Endpoint to Playoffs

Nearly every endpoint that works for the regular season accepts `season_type_all_star='Playoffs'`:

```python
# League-wide playoff stats (all players, one call)
from nba_api.stats.endpoints import leaguedashplayerstats

playoff_leaders = leaguedashplayerstats.LeagueDashPlayerStats(
	season='2024-25',
	season_type_all_star='Playoffs',
	measure_type_detailed_defense='Advanced',
	per_mode_simple='PerGame'
)
df = playoff_leaders.league_dash_player_stats.get_data_frame()

# Player career playoff splits (season by season)
from nba_api.stats.endpoints import playercareerstats

career = playercareerstats.PlayerCareerStats(player_id='203999')
df_post = career.season_totals_post_season.get_data_frame()
df_career_post = career.career_totals_post_season.get_data_frame()

# Game-by-game playoff log for one player
from nba_api.stats.endpoints import playergamelog

log = playergamelog.PlayerGameLog(
	player_id='203999',
	season='2024-25',
	season_type_all_star='Playoffs'
)
df_log = log.get_data_frames()[0]
```

### Filtering by Playoff Round

The `po_round` parameter is available on `LeagueDashPlayerStats`, `LeagueDashTeamStats`, and related endpoints:

```python
# First round only
first_round = leaguedashplayerstats.LeagueDashPlayerStats(
	season='2024-25',
	season_type_all_star='Playoffs',
	po_round=1   # 1=First Round, 2=Semis, 3=Conf Finals, 4=Finals, 0=All
)
```

---

## Live Game Data

`nba_api` has a separate `live` module that hits NBA.com's CDN for real-time in-game data. This is separate from the `stats` module.

### Today's Scoreboard

```python
from nba_api.live.nba.endpoints import scoreboard

board = scoreboard.ScoreBoard()
games = board.get_dict()

# Or get a simple view:
print(board.score_board_date)  # today's date
for game in games['scoreboard']['games']:
    home = game['homeTeam']['teamTricode']
    away = game['awayTeam']['teamTricode']
    home_score = game['homeTeam']['score']
    away_score = game['awayTeam']['score']
    status = game['gameStatusText']  # '7:30 pm ET', 'Q3 5:22', 'Final'
    print(f"{away} {away_score} @ {home} {home_score} — {status}")
```

### Live Box Score

```python
from nba_api.live.nba.endpoints import boxscore

# game_id from the scoreboard above
live_box = boxscore.BoxScore(game_id='0022300001')
game = live_box.get_dict()['game']

# Access team and player stats in real time:
home_team = game['homeTeam']
away_team = game['awayTeam']

for player in home_team['players']:
    stats = player['statistics']
    print(f"{player['name']}: {stats['points']} pts, {stats['reboundsTotal']} reb, {stats['assists']} ast")
```

### Live Play-by-Play

```python
from nba_api.live.nba.endpoints import playbyplay

pbp = playbyplay.PlayByPlay(game_id='0022300001')
actions = pbp.get_dict()['game']['actions']

for action in actions[-10:]:   # last 10 plays
    print(f"Q{action['period']} {action['clock']} — {action['description']}")
```

---

## Common Parameters Reference

Most endpoints accept these parameters. Not all apply to every endpoint.

| Parameter | Common Values | Description |
|---|---|---|
| `season` | `'2024-25'` | Season in YYYY-YY format |
| `season_type_all_star` | `'Regular Season'`, `'Playoffs'`, `'Pre Season'`, `'All Star'` | Which part of the season |
| `per_mode_simple` | `'PerGame'`, `'Totals'`, `'Per36'`, `'Per100Possessions'`, `'MinutesPer'`, `'PerPossession'`, `'PerPlay'`, `'PerMinute'` | How to normalize the stats |
| `measure_type_detailed_defense` | `'Base'`, `'Advanced'`, `'Misc'`, `'Four Factors'`, `'Scoring'`, `'Opponent'`, `'Usage'`, `'Defense'` | What category of stats |
| `last_n_games` | `0` (full season), `5`, `10`, `15` | Filter to last N games only |
| `month` | `0` (all), `1`–`12` | Filter by month |
| `period` | `0` (full game), `1`–`4` | Filter by quarter |
| `opponent_team_id` | `0` (all), or a team ID | Filter by opponent |
| `location` | `''` (all), `'Home'`, `'Road'` | Home or away games only |
| `outcome` | `''` (all), `'W'`, `'L'` | Wins or losses only |
| `conference` | `''`, `'East'`, `'West'` | Filter by conference |
| `division` | `''`, `'Atlantic'`, `'Central'`, etc. | Filter by division |
| `po_round` | `0` (all rounds), `1`–`4` | Playoff round |
| `team_id` | `0` (all teams) or a team ID | Filter to one team |
| `date_from_nullable` | `'MM/DD/YYYY'` or `''` | Start date filter |
| `date_to_nullable` | `'MM/DD/YYYY'` or `''` | End date filter |

### Season Format Examples
```python
'2024-25'   # 2024-2025 season (current format)
'2023-24'   # 2023-2024 season
'1995-96'   # works for historical seasons too
```

---

## Output Formats

Every endpoint object supports three output formats:

```python
from nba_api.stats.endpoints import leagueleaders

result = leagueleaders.LeagueLeaders(season='2024-25')

# 1. Pandas DataFrame — best for analysis, filtering, sorting
df = result.league_leaders.get_data_frame()
# Returns a standard pandas DataFrame — use .head(), .sort_values(), .query(), etc.

# 2. JSON string — best for storing or sending over HTTP
json_str = result.league_leaders.get_json()
# Returns a JSON string

# 3. Python dictionary — best for programmatic access
data_dict = result.league_leaders.get_dict()
# Returns: {'headers': [...], 'data': [[...], [...]]}

# 4. get_data_frames() — when an endpoint has multiple result sets
all_dfs = result.get_data_frames()
# Returns a list of DataFrames, one per result set

# 5. get_json() on the endpoint itself — all result sets as JSON
all_json = result.get_json()

# 6. get_dict() on the endpoint itself — all result sets as dict
all_dict = result.get_dict()
```

---

## Rate Limiting & NBA.com Blocking

### The Cloud Blocking Problem

NBA.com detects and blocks requests originating from major cloud provider IP ranges (AWS, Google Cloud, Azure, Digital Ocean, Heroku, Railway, Render, etc.). This means:

- **Local development:** Works perfectly, no issues.
- **Deployed web app hitting NBA.com in real time:** Will be blocked.

### Workarounds for Deployment

**Option A — Cache Results (Recommended)**  
Don't call NBA.com from your server on every user request. Instead, run a background job on a local machine (or VM not on a flagged IP) that fetches data on a schedule and writes it to a database (SQLite, PostgreSQL, etc.). Your deployed app reads from your database, never directly from NBA.com.

```
[Local script / cron job] → NBA.com → Your database → [Your web app]
```

**Option B — Custom Headers + Proxy**  
`nba_api` supports custom headers and proxy settings on every call. A residential proxy (IPs from home ISPs, not datacenters) can bypass the block.

```python
from nba_api.stats.endpoints import leagueleaders

headers = {
    'Host': 'stats.nba.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': 'https://www.nba.com/',
    'x-nba-stats-origin': 'stats',
    'x-nba-stats-token': 'true',
}

proxies = {
    'http': 'http://user:pass@your-proxy-host:port',
    'https': 'http://user:pass@your-proxy-host:port',
}

result = leagueleaders.LeagueLeaders(
    season='2024-25',
    headers=headers,
    proxy=proxies,
    timeout=30   # seconds; increase if you get timeout errors
)
```

**Option C — Use a CDN-hosted JSON endpoint**  
NBA.com also serves some live data through a public CDN that is not blocked. The live module endpoints (ScoreBoard, BoxScore, PlayByPlay) often work from cloud servers.

### Rate Limiting Best Practices

NBA.com doesn't publish a rate limit, but community testing suggests:
- **1 request per second** is safe for sustained use
- **3–5 requests per second** works in short bursts
- Rapid successive calls risk a temporary IP block (usually lifts in 15–30 minutes)

```python
import time

player_ids = [2544, 203999, 1629029]  # LeBron, Jokić, Luka

for pid in player_ids:
    from nba_api.stats.endpoints import playercareerstats
    career = playercareerstats.PlayerCareerStats(player_id=str(pid))
    df = career.season_totals_regular_season.get_data_frame()
    # ... process df ...
    time.sleep(1)  # be a good citizen
```

---

## Practical App Patterns

### Pattern 1 — Player Search and Profile Page

```python
from nba_api.stats.static import players
from nba_api.stats.endpoints import commonplayerinfo, playercareerstats, playerdashboardbygeneralsplits
import time

def get_player_profile(name: str, season: str = '2024-25') -> dict:
    matches = players.find_players_by_full_name(name)
    if not matches:
        return {'error': 'Player not found'}

    pid = str(matches[0]['id'])

    info = commonplayerinfo.CommonPlayerInfo(player_id=pid)
    time.sleep(0.6)

    career = playercareerstats.PlayerCareerStats(player_id=pid, per_mode36='PerGame')
    time.sleep(0.6)

    adv = playerdashboardbygeneralsplits.PlayerDashboardByGeneralSplits(
        player_id=pid, season=season, measure_type_detailed_defense='Advanced'
    )

    return {
        'info': info.common_player_info.get_data_frame().to_dict('records')[0],
        'career': career.season_totals_regular_season.get_data_frame().to_dict('records'),
        'advanced_this_season': adv.overall_player_dashboard.get_data_frame().to_dict('records'),
    }
```

### Pattern 2 — League Leaderboard

```python
from nba_api.stats.endpoints import leaguedashplayerstats
import pandas as pd

def get_advanced_leaders(season: str = '2024-25', min_games: int = 20) -> pd.DataFrame:
    result = leaguedashplayerstats.LeagueDashPlayerStats(
        season=season,
        measure_type_detailed_defense='Advanced',
        per_mode_simple='PerGame',
        season_type_all_star='Regular Season'
    )
    df = result.league_dash_player_stats.get_data_frame()

    # Filter to players with meaningful minutes
    df = df[df['GP'] >= min_games]

    # Sort by NET_RATING descending
    df = df.sort_values('NET_RATING', ascending=False)

    return df[['PLAYER_NAME', 'TEAM_ABBREVIATION', 'GP', 'MIN',
               'OFF_RATING', 'DEF_RATING', 'NET_RATING',
               'TS_PCT', 'USG_PCT', 'PIE']].reset_index(drop=True)
```

### Pattern 3 — Team Shot Chart Aggregation

```python
from nba_api.stats.endpoints import shotchartdetail
import pandas as pd

def get_team_shot_zones(team_id: str, season: str = '2024-25') -> pd.DataFrame:
    shots = shotchartdetail.ShotChartDetail(
        player_id=0,            # 0 = all players
        team_id=team_id,
        season_type_all_star='Regular Season',
        season_nullable=season,
        context_measure_simple='FGA'
    )

    df = shots.get_data_frames()[0]

    # Aggregate by zone
    zone_stats = df.groupby('SHOT_ZONE_BASIC').agg(
        FGA=('SHOT_MADE_FLAG', 'count'),
        FGM=('SHOT_MADE_FLAG', 'sum')
    ).reset_index()
    zone_stats['FG_PCT'] = zone_stats['FGM'] / zone_stats['FGA']

    return zone_stats.sort_values('FGA', ascending=False)
```

### Pattern 4 — Pulling Data for a Frontend App (Caching Pattern)

```python
import json
import time
from pathlib import Path
from datetime import date
from nba_api.stats.endpoints import leaguedashplayerstats, leaguedashteamstats

CACHE_DIR = Path('./data_cache')
CACHE_DIR.mkdir(exist_ok=True)

def fetch_and_cache_daily(season: str = '2024-25'):
    today = date.today().isoformat()

    endpoints = {
        'player_traditional': leaguedashplayerstats.LeagueDashPlayerStats(
            season=season, measure_type_detailed_defense='Base', per_mode_simple='PerGame'
        ),
    }
    time.sleep(1)

    endpoints['player_advanced'] = leaguedashplayerstats.LeagueDashPlayerStats(
        season=season, measure_type_detailed_defense='Advanced', per_mode_simple='PerGame'
    )
    time.sleep(1)

    endpoints['team_advanced'] = leaguedashteamstats.LeagueDashTeamStats(
        season=season, measure_type_detailed_defense='Advanced', per_mode_simple='PerGame'
    )

    for name, endpoint in endpoints.items():
        path = CACHE_DIR / f'{name}_{today}.json'
        path.write_text(endpoint.get_json())
        print(f"Cached: {path}")
```

---

## Full Endpoint Catalog

Below is a categorized list of the most useful endpoints. The full list has 100+ entries.

### Box Score Endpoints (Single Game)
- `BoxScoreAdvancedV3` — advanced metrics per player per game
- `BoxScoreTraditionalV3` — standard box score
- `BoxScoreFourFactorsV3` — Four Factors per game
- `BoxScoreMiscV2` — misc stats (fast break pts, pts off TO, etc.)
- `BoxScoreScoringV2` — shot type breakdown per game
- `BoxScoreUsageV2` — usage and efficiency per game
- `BoxScoreSummaryV3` — game summary (score, officials, attendance)
- `BoxScoreMatchupsV3` — individual defensive matchup data
- `BoxScoreSimilarityScore` — similarity scores between players

### Player Career / Profile
- `PlayerCareerStats` — season-by-season career stats
- `CommonPlayerInfo` — bio and current team info
- `PlayerGameLog` — game-by-game log for a season
- `PlayerNextNGames` — upcoming schedule for a player's team
- `PlayerProfileV2` — extended profile with seasonal highlights
- `PlayerVsPlayer` — head-to-head comparison

### Player Dashboards (Splits)
- `PlayerDashboardByGeneralSplits` — home/away, W/L, month, quarter, starter/bench
- `PlayerDashboardByGameSplits` — by half, by quarter, by score margin
- `PlayerDashboardByOpponent` — vs. each opponent team
- `PlayerDashboardByShootingSplits` — by shot zone, shot distance, shot type
- `PlayerDashboardByTeamPerformance` — by team win margin

### League / Season Aggregates
- `LeagueDashPlayerStats` — all players, all stat categories (best all-purpose endpoint)
- `LeagueDashTeamStats` — all teams, all stat categories
- `LeagueDashLineups` — lineup combination stats
- `LeagueDashPlayerClutch` — clutch situation stats
- `LeagueDashTeamClutch` — team clutch stats
- `LeagueDashPlayerBioStats` — physical attributes + stats
- `LeagueDashPlayerPtShot` — shot frequency and efficiency by type
- `LeagueDashTeamPtShot` — same for teams
- `LeagueLeaders` — ranked leaderboard
- `LeagueStandings` / `LeagueStandingsV3` — current standings

### Player Tracking
- `LeagueDashPtStats` — all tracking categories (Drives, Passing, SpeedDistance, etc.)
- `LeagueDashPtTeamDefend` — team defensive matchup tracking

### Hustle / Effort Stats
- `LeagueHustleStatsPlayer` — contested shots, deflections, charges, screen assists
- `LeagueHustleStatsTeam` — same for teams

### Shot Charts
- `ShotChartDetail` — X/Y coordinates for every shot
- `ShotChartLeagueWide` — league-wide shot chart data

### Play-by-Play
- `PlayByPlayV3` — full event log for a game (use V3, not V2)

### Game / Schedule
- `LeagueGameFinder` — search for games by various criteria
- `CommonPlayoffSeries` — playoff bracket and matchups

### Live Data (nba_api.live module)
- `ScoreBoard` — today's live scores
- `BoxScore` — live box score for a game in progress
- `PlayByPlay` — live play-by-play feed

### Historical / Reference
- `AllTimeLeadersGrids` — all-time NBA leaders in various categories
- `DraftHistory` — historical draft picks
- `DraftCombineStats` — pre-draft combine measurements
- `FranchiseHistory` — franchise records and history
- `TeamYearByYearStats` — franchise season-by-season history

---

## Sources

- [nba_api GitHub (swar)](https://github.com/swar/nba_api)
- [nba_api PyPI](https://pypi.org/project/nba_api/)
- [nba_api Examples Notebook](https://github.com/swar/nba_api/blob/master/docs/nba_api/stats/examples.md)
- [NBA-API Documentation](https://nba-apidocumentation.knowledgeowl.com/help)
- [LeagueDashPtStats Endpoint Docs](https://github.com/swar/nba_api/blob/master/docs/nba_api/stats/endpoints/leaguedashptstats.md)
- [LeagueDashPlayerStats Endpoint Docs](https://github.com/swar/nba_api/blob/master/docs/nba_api/stats/endpoints/leaguedashplayerstats.md)
- [Working Around NBA.com's IP Ban (Medium)](https://medium.com/@inman.justin/working-around-nba-coms-ip-ban-for-cloud-hosted-nba-api-apps-90326ab2632c)
- [How to Access Live NBA Play-By-Play Data (Medium)](https://jman4190.medium.com/how-to-accessing-live-nba-play-by-play-data-f24e02b0a976)
- [Analyzing NBA Data Using Python (Medium)](https://medium.com/@ben.g.ballard/how-to-analyze-nba-data-using-python-and-the-nba-api-429b0e65454d)
- [nba_api Rate Limiting Issue #534](https://github.com/swar/nba_api/issues/534)
- [nba_api Proxy/Header/Timeout Release Notes](https://github.com/swar/nba_api/releases/tag/v1.1.1)
