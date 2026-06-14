export interface PlayerSearchResult {
	id: number;
	full_name: string;
	first_name: string;
	last_name: string;
	is_active: boolean;
}

export interface PlayerInfo {
	DISPLAY_FIRST_LAST: string;
	TEAM_ID: number;
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
	MIN: number;
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
