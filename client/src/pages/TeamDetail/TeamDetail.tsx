import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, TrendingUp, Users, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { api } from '../../api/client';
import { TeamDetail as TeamDetailType, RosterPlayer, RosterPlayerStats } from '../../types/team';
import { getTeamColors } from '../../utils/teamColors';
import { getTeamLogoUrl } from '../../utils/nbaImages';
import PlayerAvatar from '../../components/PlayerAvatar/PlayerAvatar';
import './TeamDetail.css';

function fmtPct(value: number | null | undefined): string {
	if (value == null) return '—';
	return (value * 100).toFixed(1) + '%';
}

function fmtStat(value: number | null | undefined): string {
	if (value == null) return '—';
	return value.toFixed(1);
}

type SortKey =
	| 'PLAYER' | 'POSITION' | 'GP' | 'PTS' | 'REB' | 'AST'
	| 'STL' | 'BLK' | 'MIN' | 'FG_PCT' | 'FG3_PCT' | 'FT_PCT';

interface Column {
	key: SortKey;
	label: string;
	numeric: boolean;
}

const COLUMNS: Column[] = [
	{ key: 'PLAYER', label: 'Player', numeric: false },
	{ key: 'POSITION', label: 'Pos', numeric: false },
	{ key: 'GP', label: 'GP', numeric: true },
	{ key: 'PTS', label: 'PTS', numeric: true },
	{ key: 'REB', label: 'REB', numeric: true },
	{ key: 'AST', label: 'AST', numeric: true },
	{ key: 'STL', label: 'STL', numeric: true },
	{ key: 'BLK', label: 'BLK', numeric: true },
	{ key: 'MIN', label: 'MIN', numeric: true },
	{ key: 'FG_PCT', label: 'FG%', numeric: true },
	{ key: 'FG3_PCT', label: '3P%', numeric: true },
	{ key: 'FT_PCT', label: 'FT%', numeric: true },
];

function getSortValue(p: RosterPlayerStats, key: SortKey): string | number | null {
	if (key === 'PLAYER') return (p.PLAYER ?? '').toLowerCase();
	if (key === 'POSITION') return (p.POSITION ?? '').toLowerCase();
	return p.stats ? p.stats[key] : null;
}

function formatCell(p: RosterPlayerStats, key: SortKey): string {
	if (key === 'POSITION') return p.POSITION || '—';
	if (key === 'GP') return p.stats?.GP != null ? String(p.stats.GP) : '—';
	if (key === 'FG_PCT' || key === 'FG3_PCT' || key === 'FT_PCT') return fmtPct(p.stats?.[key]);
	return fmtStat(p.stats?.[key as keyof NonNullable<RosterPlayerStats['stats']>] as number | null | undefined);
}

export default function TeamDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [team, setTeam] = useState<TeamDetailType | null>(null);
	const [rosterStats, setRosterStats] = useState<RosterPlayerStats[]>([]);
	const [sortKey, setSortKey] = useState<SortKey>('PTS');
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [logoError, setLogoError] = useState(false);

	function handleSort(col: Column) {
		if (col.key === sortKey) {
			setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortKey(col.key);
			// Numbers default high→low, text defaults A→Z.
			setSortDir(col.numeric ? 'desc' : 'asc');
		}
	}

	const sortedRoster = useMemo(() => {
		const rows = [...rosterStats];
		rows.sort((a, b) => {
			const av = getSortValue(a, sortKey);
			const bv = getSortValue(b, sortKey);
			// Missing values always sort to the bottom, regardless of direction.
			if (av == null && bv == null) return 0;
			if (av == null) return 1;
			if (bv == null) return -1;
			let cmp: number;
			if (typeof av === 'string' && typeof bv === 'string') {
				cmp = av.localeCompare(bv);
			} else {
				cmp = (av as number) - (bv as number);
			}
			return sortDir === 'asc' ? cmp : -cmp;
		});
		return rows;
	}, [rosterStats, sortKey, sortDir]);

	useEffect(() => {
		if (!id) return;
		setLoading(true);
		setError('');
		api.get<TeamDetailType>(`/teams/${id}`)
			.then(({ data }) => setTeam(data))
			.catch(() => setError('Failed to load team. Make sure the server is running.'))
			.finally(() => setLoading(false));

		api.get<RosterPlayerStats[]>(`/teams/${id}/players`)
			.then(({ data }) => setRosterStats(data))
			.catch(() => setRosterStats([]));
	}, [id]);

	if (loading) {
		return (
			<div className="td-loading">
				<div className="td-spinner" />
			</div>
		);
	}

	if (error || !team) {
		return (
			<div className="td-error">
				<p>{error || 'Team not found.'}</p>
				<button className="td-back-btn" onClick={() => navigate('/')}>
					<ArrowLeft size={16} />
					Back to Home
				</button>
			</div>
		);
	}

	const stats = team.currentSeasonStats;
	const wins = stats.W ?? 0;
	const winPercentage = stats.W_PCT != null ? (stats.W_PCT * 100).toFixed(1) : null;

	const roster: RosterPlayer[] = (team.roster || []) as RosterPlayer[];
	const colors = getTeamColors(team.abbreviation);

	return (
		<div className="td-page">
			<div
				className="td-header"
				style={{
					background: `linear-gradient(to bottom, color-mix(in srgb, ${colors.primary} 15%, transparent), transparent)`,
				}}
			>
				<div className="td-container">
					<button className="td-back-btn" onClick={() => navigate('/')}>
						<ArrowLeft size={16} />
						Back to Teams
					</button>

					<div className="td-hero">
						<div className="td-logo">
							{!logoError ? (
								<img
									className="td-logo-img"
									src={getTeamLogoUrl(team.id)}
									alt={`${team.full_name} logo`}
									onError={() => setLogoError(true)}
								/>
							) : (
								team.abbreviation
							)}
						</div>
						<div>
							<h1 className="td-team-name">{team.full_name}</h1>
							<div className="td-meta">
								<div className="td-meta-row">
									<span className="td-meta-item">{team.city}, {team.state}</span>
									<span className="td-meta-dot">•</span>
									<span className="td-meta-item">Est. {team.year_founded}</span>
								</div>
								<div className="td-meta-row">
									<span className="td-meta-item">{team.abbreviation}</span>
								</div>
								{(team.standings?.conference != null && team.standings?.division != null) && (
									<div className="td-meta-row">
										<span className="td-meta-item">{team.standings.conference}</span>
										<span className="td-meta-dot">•</span>
										<span className="td-meta-item">{team.standings.division}</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="td-container">
				<div className="td-stats-grid">
					<div
						className="td-stat-card"
						style={{ borderColor: `color-mix(in srgb, ${colors.primary} 30%, transparent)` }}
					>
						<div className="td-stat-header">
							<div
								className="td-stat-icon"
								style={{ backgroundColor: `color-mix(in srgb, ${colors.primary} 20%, transparent)` }}
							>
								<Trophy size={20} style={{ color: colors.primary }} />
							</div>
							<h3 className="td-stat-label">Wins</h3>
						</div>
						<p className="td-stat-value">{wins}</p>
						<p className="td-stat-sublabel">Total victories</p>
					</div>

					<div
						className="td-stat-card"
						style={{ borderColor: `color-mix(in srgb, ${colors.secondary} 30%, transparent)` }}
					>
						<div className="td-stat-header">
							<div
								className="td-stat-icon"
								style={{ backgroundColor: `color-mix(in srgb, ${colors.secondary} 20%, transparent)` }}
							>
								<TrendingUp size={20} style={{ color: colors.secondary }} />
							</div>
							<h3 className="td-stat-label">Win Percentage</h3>
						</div>
						<p className="td-stat-value">{winPercentage != null ? `${winPercentage}%` : '—'}</p>
						<p className="td-stat-sublabel">Season win rate</p>
					</div>

					<div
						className="td-stat-card"
						style={{ borderColor: `color-mix(in srgb, ${colors.primary} 30%, transparent)` }}
					>
						<div className="td-stat-header">
							<div
								className="td-stat-icon"
								style={{ backgroundColor: `color-mix(in srgb, ${colors.primary} 20%, transparent)` }}
							>
								<Users size={20} style={{ color: colors.primary }} />
							</div>
							<h3 className="td-stat-label">Roster Size</h3>
						</div>
						<p className="td-stat-value">{roster.length}</p>
						<p className="td-stat-sublabel">Active players</p>
					</div>
				</div>

				<div
					className="td-roster-card"
					style={{ borderColor: `color-mix(in srgb, ${colors.primary} 30%, transparent)` }}
				>
					<h3 className="td-roster-title">
						<Users size={20} />
						Team Roster
					</h3>

					{rosterStats.length === 0 ? (
						<div className="td-empty">No players available for this team</div>
					) : (
						<div className="td-table-wrap">
							<table className="td-table">
								<thead>
									<tr>
										{COLUMNS.map(col => {
											const active = col.key === sortKey;
											return (
												<th
													key={col.key}
													className={`td-th-sortable${col.numeric ? ' td-th-numeric' : ''}${active ? ' td-th-active' : ''}`}
													onClick={() => handleSort(col)}
												>
													<span className="td-th-inner">
														{col.label}
														{active ? (
															sortDir === 'asc'
																? <ChevronUp size={14} />
																: <ChevronDown size={14} />
														) : (
															<ChevronsUpDown size={14} className="td-th-icon-idle" />
														)}
													</span>
												</th>
											);
										})}
									</tr>
								</thead>
								<tbody>
									{sortedRoster.map((player, i) => (
										<tr
											key={player.PLAYER_ID ?? i}
											className="td-table-row"
											onClick={() => navigate(`/players/${player.PLAYER_ID}`)}
										>
											{COLUMNS.map(col => (
												col.key === 'PLAYER' ? (
													<td key={col.key}>
														<div className="td-table-player">
															<div className="td-table-avatar">
																<PlayerAvatar
																	playerId={player.PLAYER_ID}
																	alt={player.PLAYER ?? ''}
																	fallback={`#${player.NUM || '–'}`}
																/>
															</div>
															<span className="td-table-name">{player.PLAYER}</span>
														</div>
													</td>
												) : (
													<td key={col.key} className={col.numeric ? 'td-td-numeric' : ''}>
														{formatCell(player, col.key)}
													</td>
												)
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
