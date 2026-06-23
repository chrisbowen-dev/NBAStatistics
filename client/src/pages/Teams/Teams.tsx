import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Team, TeamStandings, TeamSeasonStats } from '../../types/team';
import { getTeamLogoUrl } from '../../utils/nbaImages';
import { TEAM_COLORS, DEFAULT_TEAM_COLORS } from '../../utils/teamColors';
import './Teams.css';

interface TeamListItem extends Team {
	standings?: TeamStandings;
	currentSeasonStats?: Partial<TeamSeasonStats>;
}

function hexToRgb(hex: string): string {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `${r}, ${g}, ${b}`;
}

function calcGB(leaderW: number, leaderL: number, teamW: number, teamL: number): string {
	const gb = ((leaderW - teamW) + (teamL - leaderL)) / 2;
	if (gb <= 0) return '—';
	return gb % 1 === 0 ? String(gb) : gb.toFixed(1);
}

function getSeasonLabel(): string {
	const now = new Date();
	const year = now.getFullYear();
	return now.getMonth() + 1 >= 10 ? `${year}–${year + 1}` : `${year - 1}–${year}`;
}

const CONF_ORDER = ['West', 'East'] as const;

const CONF_DISPLAY: Record<string, string> = {
	West: 'Western Conference',
	East: 'Eastern Conference',
};

export default function Teams() {
	const [teams, setTeams] = useState<TeamListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		api.get<TeamListItem[]>('/teams')
			.then(({ data }) => setTeams(data))
			.catch(() => setError('Failed to load teams. Make sure the server is running.'))
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<div className="tm-loading">
				<div className="tm-spinner" />
			</div>
		);
	}

	if (error) {
		return <p className="tm-error">{error}</p>;
	}

	const seasonRaw = teams.find(t => t.currentSeasonStats?.GROUP_VALUE)?.currentSeasonStats?.GROUP_VALUE;
	const season = seasonRaw ? seasonRaw.replace('-', '–') : getSeasonLabel();

	const conferences = CONF_ORDER.map(conf => {
		const confTeams = teams
			.filter(t => t.standings?.conference === conf)
			.sort((a, b) => (a.standings?.conf_rank ?? 99) - (b.standings?.conf_rank ?? 99));
		return { conf, teams: confTeams };
	});

	function renderTeamRow(team: TeamListItem, rank: number, leaderW: number, leaderL: number) {
		const colors = TEAM_COLORS[team.abbreviation] ?? DEFAULT_TEAM_COLORS;
		const primaryRgb = hexToRgb(colors.primary);
		const wins = team.currentSeasonStats?.W ?? 0;
		const losses = team.currentSeasonStats?.L ?? 0;
		const wPct = team.currentSeasonStats?.W_PCT;
		const winPct = wPct != null ? wPct.toFixed(3).replace(/^0/, '') : '—';
		const gb = calcGB(leaderW, leaderL, wins, losses);

		return (
			<Link
				key={team.id}
				className="tm-team-row"
				to={`/teams/${team.id}`}
				style={{
					borderLeftColor: `rgba(${primaryRgb}, 0.7)`,
					background: `rgba(${primaryRgb}, 0.05)`,
				}}
			>
				<span className="tm-rank">{rank}</span>
				<div className="tm-logo-slot">
					<img
						src={getTeamLogoUrl(team.id)}
						alt={team.abbreviation}
						className="tm-logo-img"
						onError={e => {
							e.currentTarget.style.display = 'none';
							const fallback = e.currentTarget.parentElement?.querySelector('.tm-logo-fallback') as HTMLElement | null;
							if (fallback) fallback.style.display = 'flex';
						}}
					/>
					<div
						className="tm-logo-fallback"
						style={{
							background: `rgba(${primaryRgb}, 0.18)`,
							border: `1px solid rgba(${primaryRgb}, 0.3)`,
						}}
					>
						{team.abbreviation}
					</div>
				</div>
				<span className="tm-team-name">{team.full_name}</span>
				<span className="tm-stat tm-stat--wl">{wins}-{losses}</span>
				<span className="tm-stat tm-stat--winpct">{winPct}</span>
				<span className="tm-stat tm-stat--gb">{gb}</span>
			</Link>
		);
	}

	return (
		<div className="tm-page">
			<div className="tm-page-header">
				<div>
					<h1 className="tm-page-title">Teams</h1>
					<p className="tm-page-sub">NBA Conference Standings</p>
				</div>
				<span className="tm-season-badge">{season}</span>
			</div>

			<div className="tm-conferences">
				{conferences.map(({ conf, teams: confTeams }) => {
					const leader = confTeams[0];
					const leaderW = leader?.currentSeasonStats?.W ?? 0;
					const leaderL = leader?.currentSeasonStats?.L ?? 0;

					const playoff = confTeams.slice(0, 6);
					const playIn = confTeams.slice(6, 10);
					const eliminated = confTeams.slice(10);

					return (
						<div key={conf} className="tm-conf-card">
							<div className="tm-conf-header">
								<span className="tm-conf-name">{CONF_DISPLAY[conf]}</span>
								<div className="tm-conf-cols">
									<span className="tm-conf-col-label">W-L</span>
									<span className="tm-conf-col-label">Win%</span>
									<span className="tm-conf-col-label tm-conf-col-label--gb">GB</span>
								</div>
							</div>

							{playoff.map((team, idx) => renderTeamRow(team, idx + 1, leaderW, leaderL))}

							<div className="tm-divider">
								<div className="tm-divider-line" />
								<span className="tm-divider-label">Play-In</span>
								<div className="tm-divider-line" />
							</div>

							{playIn.map((team, idx) => renderTeamRow(team, 7 + idx, leaderW, leaderL))}

							<div className="tm-divider">
								<div className="tm-divider-line" />
								<span className="tm-divider-label">Eliminated</span>
								<div className="tm-divider-line" />
							</div>

							{eliminated.map((team, idx) => renderTeamRow(team, 11 + idx, leaderW, leaderL))}
						</div>
					);
				})}
			</div>
		</div>
	);
}
