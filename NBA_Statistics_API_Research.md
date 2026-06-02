# NBA Statistics API Research
**Date:** May 29, 2026  
**Goal:** Identify data sources for an NBA statistics application with access to advanced metrics.

---

## Summary

There are excellent free options available — particularly if you're comfortable with Python or hitting a REST API directly. The single best free option is `nba_api`, which wraps NBA.com's own (unofficial) endpoints and exposes a massive range of advanced and tracking stats. Several other free community APIs and scrapers round out the picture. Paid options exist for enterprise/commercial use but are overkill for a personal or indie project.

---

## FREE OPTIONS

---

### 1. `nba_api` — Python Library (Best Free Option)
**Source:** [github.com/swar/nba_api](https://github.com/swar/nba_api)  
**PyPI:** [pypi.org/project/nba_api](https://pypi.org/project/nba_api/)  
**Docs:** [nba-apidocumentation.knowledgeowl.com](https://nba-apidocumentation.knowledgeowl.com/help)

#### What it is
An open-source Python package (MIT License) that wraps the undocumented JSON endpoints that power NBA.com itself. NBA.com serves its own stats pages from these endpoints — `nba_api` simply exposes them in a clean Python interface. No API key is required.

#### Installation
```bash
pip install nba_api
```
Requires Python 3.10+, plus `requests` and `numpy`.

#### Advanced Stats Available
The library maps **100+ endpoints**. Highlights relevant to advanced stats:

| Endpoint | What it provides |
|---|---|
| `BoxScoreAdvancedV2` | Per-game advanced box score (TS%, eFG%, ORtg, DRtg, etc.) |
| `BoxScoreFourFactorsV2` | Dean Oliver's Four Factors per game |
| `BoxScoreUsageV2` | Usage rate and efficiency by game |
| `BoxScoreMiscV2` | Points off turnovers, fast break points, etc. |
| `PlayerDashboardByGameSplits` | Player splits (home/away, wins/losses, etc.) |
| `PlayerDashboardByGeneralSplits` | Broad advanced splits for any player |
| `LeagueDashPlayerStats` | League-wide player stats including advanced |
| `LeagueDashPtStats` | **Player tracking** — SpeedDistance, Drives, Passing, CatchShoot, PullUpShot, Defense, Elbow/Post/Paint touches, Efficiency |
| `LeagueDashPlayerBioStats` | Player bios + physical attributes |
| `ShotChartDetail` | Full shot chart data for any player/game |
| `WinProbabilityPbp` | Win probability on every play |
| `AssistTracker` | Assist tracking analytics |
| `DefenseHub` | Defensive performance hub |
| `DraftBoard` | Draft historical data |

The `HomePageV2` endpoint supports a `StatType` parameter with values: `Traditional`, `Advanced`, and `Tracking` — giving you all three tiers in one place.

#### Important Caveat
NBA.com has **blocked these endpoints on cloud hosting providers** (AWS, Digital Ocean, Heroku, etc.). They work perfectly when developing and running locally. If you later want to deploy a web app that calls these endpoints server-side, you'll need a workaround (a residential proxy, a VPS not on a flagged IP block, or caching results).

#### Rating for this project
**Excellent.** Free, no key needed, massive stat depth including tracking data.

---

### 2. BallDontLie API — REST API
**Website:** [balldontlie.io](https://www.balldontlie.io/)  
**Docs:** [docs.balldontlie.io](https://docs.balldontlie.io/)

#### What it is
A well-maintained REST API covering NBA and 20+ other sports leagues. Has an explicit **advanced stats endpoint** and is one of the most developer-friendly free options.

#### Key Endpoint
```
GET /nba/v2/stats/advanced
  ?seasons[]=2025
  &player_ids[]=175
  &period=0
```
Returns full-game advanced stats (e.g., Shai Gilgeous-Alexander's 2025-26 season).

#### Free Tier
The API has a free tier. The exact rate limits of the free tier are not fully published — check their documentation for current limits. Paid tiers exist for higher volume usage.

#### Advanced Stats Available
- Offensive Rating / Defensive Rating
- Net Rating
- True Shooting Percentage (TS%)
- Assist-to-turnover ratio
- Usage Rate
- Pace
- Pie (Player Impact Estimate)

#### Rating for this project
**Very Good.** Simpler to use than `nba_api` (standard REST vs. Python library), has a dedicated advanced stats endpoint, and has clear documentation.

---

### 3. nprasad2077 nbaStats — Community REST API
**GitHub:** [github.com/nprasad2077/nbaStats](https://github.com/nprasad2077/nbaStats)  
**Postman Docs:** [NBA Stats API](https://documenter.getpostman.com/view/24232555/2s93shzpR3)  
**Base URL:** `https://api.server.nbaapi.com/`

#### What it is
A community-built REST API (currently in public beta) that provides advanced player metrics. No authentication required. Also has a **GraphQL endpoint** for flexible querying.

#### Advanced Stats Available
This API specifically targets the metrics you're most interested in:
- **PER** (Player Efficiency Rating)
- **TS%** (True Shooting Percentage)
- **Usage Percentage**
- **Win Shares**
- **VORP** (Value Over Replacement Player)

#### Example Query
```
GET /playeradvancedstats?season=2024&sortBy=vorp&pageSize=20
```

#### GraphQL Support
Also exposes a GraphQL endpoint allowing queries like:
```graphql
query {
  playerAdvanced(season: 2024) {
    playerName
    per
    winShares
    vorp
    usagePercent
  }
}
```

#### Caveats
This is a community project and may have uptime/reliability concerns compared to official sources. Good for experimentation.

#### Rating for this project
**Good.** Has exactly the advanced metrics requested (PER, Win Shares, VORP) and requires zero auth setup. Best used as a supplement or quick-start option.

---

### 4. Basketball Reference Scrapers — Python Libraries
**basketball-reference-scraper (PyPI):** [pypi.org/project/basketball-reference-scraper](https://pypi.org/project/basketball-reference-scraper/)  
**basketball_reference_web_scraper:** [github.com/jaebradley/basketball_reference_web_scraper](https://github.com/jaebradley/basketball_reference_web_scraper)

#### What it is
Basketball Reference (sports-reference.com) is the gold standard for historical NBA stats. There is no official API, but several well-maintained Python scraper libraries exist that parse the site's HTML.

#### Stat Types Available
| Type | Examples |
|---|---|
| `per_game` | Points, rebounds, assists per game |
| `totals` | Cumulative season totals |
| `advanced` | TS%, eFG%, ORB%, DRB%, AST%, STL%, BLK%, TOV%, USG%, ORtg, DRtg, OWS, DWS, WS, WS/48, OBPM, DBPM, BPM, VORP |

The `advanced` stat type is particularly deep — VORP, BPM (Box Plus/Minus), Win Shares, and more are all accessible.

#### Modules Available
- `teams` — Team stats and history
- `players` — Player season and career stats
- `seasons` — Season-level data
- `box_scores` — Individual game box scores
- `pbp` — Play-by-play data
- `shot_charts` — Shot chart data
- `injury_report` — Injury data

#### Rate Limits
Sports Reference enforces a **20 requests/minute** limit. The scraper library handles this automatically by waiting when needed.

#### Important Legal Note
Sports Reference's Terms of Service restrict scraping for commercial use. For a personal project or educational app, this is generally acceptable — but do not use this for anything commercial without reviewing their ToS.

#### Rating for this project
**Very Good for historical data.** The deepest historical advanced stats available for free. Best for season-level analysis, player comparisons over time, and historical research. Not ideal for real-time game data.

---

### 5. py_ball — Python Library
**GitHub:** [github.com/basketballrelativity/py_ball](https://github.com/basketballrelativity/py_ball)

#### What it is
Another Python wrapper for stats.nba.com with a focus on both NBA and WNBA applications. Emphasizes fully documented code. Similar in scope to `nba_api` but a lighter alternative.

#### Rating for this project
**Decent alternative** to `nba_api` if you want better documentation or WNBA coverage.

---

## PAID OPTIONS

---

### 6. Sportradar NBA API — Enterprise (Official NBA Partner)
**Website:** [developer.sportradar.com](https://developer.sportradar.com/basketball/reference/nba-overview)  
**Marketplace:** [marketplace.sportradar.com](https://marketplace.sportradar.com/products/64d186778ad4bfe2bd064a26)

#### What it is
Sportradar has been the **Official Provider of Real-Time NBA League Statistics** since the 2017-18 season, operating on-venue using the NBA Global Statistical System (NGSS). This is the highest-quality, most authoritative NBA data feed available commercially.

#### What's Included
- 36+ distinct data feeds
- Near real-time scores and play-by-play
- Full advanced statistics
- **Push feeds** — open a streaming connection and receive data continuously without polling
- RESTful feeds for on-demand queries
- Historical data going back many seasons

#### Pricing
Enterprise contracts — typically **$10,000+/month**, negotiated directly through their sales team. No public pricing page. A **30-day free trial** is available to test the API before committing.

#### Rating for this project
**Overkill for a personal project.** Appropriate for commercial sports apps, fantasy platforms, or media companies. The free trial is worth exploring if you want to see what professional-grade data looks like.

---

### 7. SportsDataIO — Semi-Professional
**Website:** [sportsdata.io/nba-api](https://sportsdata.io/nba-api)  
**Discovery Lab (Free Historical Access):** [discoverylab.sportsdata.io](https://discoverylab.sportsdata.io/personal-use-apis/nba)

#### What it is
A mid-tier sports data provider with a developer-friendly approach. Unique among paid providers in offering **free access to last season's data** through their Discovery Lab program — useful for building and testing without paying.

#### What's Included
- Real-time scores and schedules
- Player and team statistics
- Play-by-play data
- Projections and DFS salary data
- Advanced stats
- Historical database (decades of data)
- BAKER Predictive Engine (their proprietary prediction system)

#### Pricing
- **Free:** Discovery Lab gives free access to last season's data (no credit card)
- **Free Trial:** Full live + historical access, no credit card required
- **Paid:** Starts around **$100/month** for lower tiers; enterprise pricing for full access
- Custom pricing for high-volume or commercial use

#### Rating for this project
**Best paid-but-accessible option.** The Discovery Lab free tier is genuinely useful. If you outgrow the free NBA.com endpoints and need something more reliable with live data, this is the logical next step before enterprise-level providers.

---

### 8. RapidAPI NBA APIs — Aggregated Marketplace Options
**Marketplace:** [rapidapi.com/collection/nba-stat-api](https://rapidapi.com/collection/nba-stat-api)

#### What it is
RapidAPI hosts multiple third-party NBA API providers under one marketplace with unified billing. Useful if you want a quick REST API without writing Python.

#### Notable APIs on RapidAPI
| API | Free Tier | Advanced Stats |
|---|---|---|
| API-Sports NBA | Yes (limited) | Moderate |
| API-Basketball (NBA) | Yes (limited) | Moderate |
| NBA API Free Data | Yes | Basic |
| Free NBA | Yes | Basic |

#### Pricing
Most have free tiers with 100-500 requests/month, then paid tiers ranging from $5–$50/month for higher volumes.

#### Rating for this project
**Convenient but limited.** Good for quick prototyping. Advanced stats depth is lower than `nba_api` or Basketball Reference scrapers.

---

### 9. Genius Sports — Enterprise (Official NBA NGSS)
**Website:** [geniussports.com](https://www.geniussports.com/engage/official-sports-data-api/)  
**Developer Portal:** [developer.geniussports.com](https://developer.geniussports.com/nbangss/stream/)

#### What it is
Genius Sports operates the **NBA Next Gen Stats System (NGSS)** — the official tracking system installed in NBA arenas. This is the source of the player tracking data you see on NBA.com (speed, acceleration, court location).

#### What's Included
- Player position tracking 25 times per second
- Speed and acceleration per player
- Advanced tracking-based metrics (completion probability, defensive coverage, etc.)
- Official broadcast-quality data feed
- Near real-time streaming API

#### Pricing
Enterprise only — contact sales. No public pricing. Intended for media companies, broadcast partners, and official league use.

#### Rating for this project
**Not realistic for personal use.** Included here for awareness — this is where the deepest tracking data lives.

---

### 10. Stats Perform (Opta / STATS SportVU) — Enterprise
**Website:** [statsperform.com](https://www.statsperform.com/resource/utilizing-advanced-nba-analytics-for-media/)

#### What it is
Stats Perform (formed from the merger of Opta and STATS) operates the **STATS SportVU®** system — a six-camera setup in NBA arenas tracking players and the ball 25 times per second. It powers AI-driven advanced analytics for teams, media, and betting operators.

#### What's Included
- Real-time player/ball positional data (25 fps)
- AI-driven derived metrics (xG, spacing, defensive assignments)
- Historical Opta data going back decades
- Media content packages

#### Pricing
Enterprise only. Intended for professional sports teams, media rights holders, and sportsbooks.

#### Rating for this project
**Not realistic for personal use.** Included for completeness.

---

## Recommended Approach for Your Project

For a fun personal NBA stats display app, this is the suggested path:

1. **Start with `nba_api` (Python).** It's the most powerful free option, gives you access to the same data behind NBA.com, and covers advanced stats + player tracking with no API key.

2. **Supplement with Basketball Reference scrapers** for deeper historical and season-level advanced stats (PER, VORP, BPM, Win Shares going back decades).

3. **Use BallDontLie or nprasad2077's API** if you want a simple REST endpoint you can hit from any language without a Python dependency.

4. **Only consider SportsDataIO** if you need reliable live data in production and the NBA.com cloud-blocking issue becomes a problem.

---

## Quick Comparison Table

| Source | Cost | Advanced Stats | Live Data | Ease of Use | Notes |
|---|---|---|---|---|---|
| `nba_api` | Free | Excellent | Yes | Medium (Python) | Best free option overall |
| BallDontLie | Free tier | Good | Yes | Easy (REST) | Simple JSON API |
| nprasad2077 nbaStats | Free | Good (PER, VORP, WS) | Unclear | Easy (REST/GraphQL) | Community project, beta |
| Basketball Ref scrapers | Free | Excellent (historical) | No | Medium (Python) | Best historical depth |
| py_ball | Free | Good | Yes | Medium (Python) | WNBA support too |
| SportsDataIO | $100+/mo (free trial) | Very Good | Yes | Easy (REST) | Discovery Lab free tier |
| RapidAPI APIs | Free tier + paid | Moderate | Yes | Easy (REST) | Convenient marketplace |
| Sportradar | $10,000+/mo | Best in class | Yes (Push) | Enterprise | Official NBA partner |
| Genius Sports | Enterprise | Best (tracking) | Yes (NGSS) | Enterprise | Official NGSS provider |
| Stats Perform | Enterprise | Best (SportVU) | Yes | Enterprise | 25fps tracking data |

---

## Sources

- [nba_api GitHub (swar)](https://github.com/swar/nba_api)
- [nba_api PyPI](https://pypi.org/project/nba_api/)
- [NBA-API Documentation](https://nba-apidocumentation.knowledgeowl.com/help)
- [BallDontLie](https://www.balldontlie.io/)
- [BallDontLie API Docs](https://docs.balldontlie.io/)
- [nprasad2077 nbaStats GitHub](https://github.com/nprasad2077/nbaStats)
- [NBA Stats API Postman Docs](https://documenter.getpostman.com/view/24232555/2s93shzpR3)
- [basketball-reference-scraper PyPI](https://pypi.org/project/basketball-reference-scraper/)
- [basketball_reference_web_scraper GitHub](https://github.com/jaebradley/basketball_reference_web_scraper)
- [py_ball GitHub](https://github.com/basketballrelativity/py_ball)
- [Sportradar NBA API](https://developer.sportradar.com/basketball/reference/nba-overview)
- [Sportradar Marketplace](https://marketplace.sportradar.com/products/64d186778ad4bfe2bd064a26)
- [SportsDataIO NBA API](https://sportsdata.io/nba-api)
- [SportsDataIO Discovery Lab](https://discoverylab.sportsdata.io/personal-use-apis/nba)
- [Genius Sports Official NBA Data API](https://www.geniussports.com/engage/official-sports-data-api/)
- [Genius Sports Developer Portal (NGSS)](https://developer.geniussports.com/nbangss/stream/)
- [Stats Perform NBA Analytics](https://www.statsperform.com/resource/utilizing-advanced-nba-analytics-for-media/)
- [RapidAPI NBA Stat APIs](https://rapidapi.com/collection/nba-stat-api)
- [NBA.com Stats](https://www.nba.com/stats)
