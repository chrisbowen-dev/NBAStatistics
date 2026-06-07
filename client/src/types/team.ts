export interface Team {
	id: number;
	full_name: string;
	abbreviation: string;
	nickname: string;
	city: string;
	state: string;
	year_founded: number;
}

/** TeamBackground result set from nba_api TeamDetails endpoint */
export interface TeamBackground {
	TEAM_ID: number;
	ABBREVIATION: string;
	NICKNAME: string;
	YEARFOUNDED: number;
	CITY: string;
	ARENA: string;
	ARENACAPACITY: string;
	OWNER: string;
	GENERALMANAGER: string;
	HEADCOACH: string;
	DLEAGUEAFFILIATION: string;
}

/** League standings from nba_api LeagueStandingsV3 endpoint */
export interface TeamStandings {
	conf_rank: number;
	div_rank: number;
	conference: string;
	division: string;
	conf_record: string;
	div_record: string;
}

/** OverallTeamDashboard result set from nba_api TeamDashboardByGeneralSplits endpoint */
export interface TeamSeasonStats {
	GROUP_SET: string;
	GROUP_VALUE: string;
	TEAM_ID: number;
	TEAM_NAME: string;
	GP: number;
	W: number;
	L: number;
	W_PCT: number;
	MIN: number;
	FGM: number;
	FGA: number;
	FG_PCT: number;
	FG3M: number;
	FG3A: number;
	FG3_PCT: number;
	FTM: number;
	FTA: number;
	FT_PCT: number;
	OREB: number;
	DREB: number;
	REB: number;
	AST: number;
	TOV: number;
	STL: number;
	BLK: number;
	BLKA: number;
	PF: number;
	PFD: number;
	PTS: number;
	PLUS_MINUS: number;
	GP_RANK: number;
	W_RANK: number;
	L_RANK: number;
	W_PCT_RANK: number;
	MIN_RANK: number;
	FGM_RANK: number;
	FGA_RANK: number;
	FG_PCT_RANK: number;
	FG3M_RANK: number;
	FG3A_RANK: number;
	FG3_PCT_RANK: number;
	FTM_RANK: number;
	FTA_RANK: number;
	FT_PCT_RANK: number;
	OREB_RANK: number;
	DREB_RANK: number;
	REB_RANK: number;
	AST_RANK: number;
	TOV_RANK: number;
	STL_RANK: number;
	BLK_RANK: number;
	BLKA_RANK: number;
	PF_RANK: number;
	PFD_RANK: number;
	PTS_RANK: number;
	PLUS_MINUS_RANK: number;
}

/** CommonTeamRoster result set from nba_api CommonTeamRoster endpoint */
export interface RosterPlayer {
	TeamID: number;
	SEASON: string;
	LeagueID: string;
	PLAYER: string;
	NICKNAME: string;
	PLAYER_SLUG: string;
	NUM: string;
	POSITION: string;
	HEIGHT: string;
	WEIGHT: string;
	BIRTH_DATE: string;
	AGE: number;
	EXP: string;
	SCHOOL: string;
	PLAYER_ID: number;
	HOW_ACQUIRED: string;
}

export interface TeamDetail extends Team {
	details?: TeamBackground;
	standings?: TeamStandings;
	roster: RosterPlayer[];
	currentSeasonStats: TeamSeasonStats;
}
