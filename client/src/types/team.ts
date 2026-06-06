export interface Team {
	id: number;
	full_name: string;
	abbreviation: string;
	nickname: string;
	city: string;
	state: string;
	year_founded: number;
}

export interface TeamDetail extends Team {
	roster: RosterPlayer[];
	currentSeasonStats: Record<string, unknown>;
}

export interface RosterPlayer {
	PLAYER_ID: number;
	PLAYER: string;
	NUM: string;
	POSITION: string;
	HOW_ACQUIRED: string;
	AGE: number;
}
