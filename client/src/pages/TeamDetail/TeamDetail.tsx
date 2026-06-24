import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	ArrowLeft, Trophy, TrendingUp, Users,
	Share2, ArrowUpFromLine, ShieldBan, Crosshair, Target, Medal, Icon,
} from 'lucide-react';
import { basketball } from '@lucide/lab';
import { api } from '../../api/client';
import { TeamDetail as TeamDetailType, RosterPlayerStats } from '../../types/team';
import { getTeamColors } from '../../utils/teamColors';
import { getTeamLogoUrl } from '../../utils/nbaImages';
import PlayerAvatar from '../../components/PlayerAvatar/PlayerAvatar';
import './TeamDetail.css';

function hexToRgb(hex: string): string {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `${r}, ${g}, ${b}`;
}

function fmtPct(value: number | null | undefined): string {
	if (value == null) return '—';
	return (value * 100).toFixed(1) + '%';
}

function fmtStat(value: number | null | undefined): string {
	if (value == null) return '—';
	return value.toFixed(1);
}

function perGame(total: number, gp: number): number | null {
	if (gp === 0) return null;
	return total / gp;
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
	if (key === 'POSITION') {
		const pos = p.POSITION || '';
		if (pos.toLowerCase().includes('guard')) return 'G';
		if (pos.toLowerCase().includes('forward')) return 'F';
		if (pos.toLowerCase().includes('center')) return 'C';
		return pos || '—';
	}
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
			setSortDir(col.numeric ? 'desc' : 'asc');
		}
	}

	const sortedRoster = useMemo(() => {
		const rows = [...rosterStats];
		rows.sort((a, b) => {
			const av = getSortValue(a, sortKey);
			const bv = getSortValue(b, sortKey);
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
				<button className="td-back-btn" onClick={() => navigate('/teams')}>
					<ArrowLeft size={14} />
					Back to Teams
				</button>
			</div>
		);
	}

	const stats = team.currentSeasonStats;
	const colors = getTeamColors(team.abbreviation);
	const primaryRgb = hexToRgb(colors.primary);
	const secondaryRgb = hexToRgb(colors.secondary);

	return (
		<div
			className="td-page"
			style={{
				'--team-primary': colors.primary,
				'--team-secondary': colors.secondary,
			} as React.CSSProperties}
		>
			<div
				className="td-header"
				style={{
					'--primary-rgb': primaryRgb,
					'--secondary-rgb': secondaryRgb,
				} as React.CSSProperties}
			>
				<div className="td-container">
					<button className="td-back-btn" onClick={() => navigate('/teams')}>
						<ArrowLeft size={14} />
						Back to Teams
					</button>

					<div className="td-hero">
						<div
							className="td-logo"
							style={{
								background: `rgba(${primaryRgb}, 0.2)`,
								border: `1px solid rgba(${secondaryRgb}, 0.25)`,
							}}
						>
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
									<span
										className="td-meta-abbr"
										style={{ color: `rgba(${secondaryRgb}, 0.75)` }}
									>
										{team.abbreviation}
									</span>
									<span className="td-meta-dot">•</span>
									<span className="td-meta-item">{team.city}, {team.state}</span>
									<span className="td-meta-dot">•</span>
									<span className="td-meta-item">Est. {team.year_founded}</span>
								</div>
								{team.standings && (
									<div className="td-meta-row">
										<span className="td-meta-item">{team.standings.conference} Conference</span>
										<span className="td-meta-dot">•</span>
										<span className="td-meta-item">{team.standings.division} Division</span>
									</div>
								)}
								{team.standings?.conf_rank != null && (
									<div className="td-meta-row">
										<span
											className="td-conf-badge"
											style={{
												color: `rgba(${secondaryRgb}, 0.85)`,
												background: `rgba(${secondaryRgb}, 0.08)`,
												border: `1px solid rgba(${secondaryRgb}, 0.22)`,
											}}
										>
											<span
												className="td-conf-badge-dot"
												style={{ background: `rgba(${secondaryRgb}, 0.7)` }}
											/>
											#{team.standings.conf_rank} Seed · {team.standings.conference} Conference
										</span>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="td-container">
				<div className="td-stats-grid">
					{/* Row 1 */}
					<div
						className="td-stat-card"
						style={{ border: `1px solid rgba(${secondaryRgb}, 0.28)` }}
					>
						<div
							className="td-stat-card-gradient"
							style={{ background: `linear-gradient(150deg, rgba(${primaryRgb}, 0.07) 0%, transparent 55%)` }}
						/>
						<div className="td-stat-header">
							<div className="td-stat-icon" style={{ background: `rgba(${primaryRgb}, 0.22)` }}>
								<Trophy size={14} style={{ color: colors.primary }} />
							</div>
							<span className="td-stat-label">W-L Record</span>
						</div>
						<p className="td-stat-value">{stats.W ?? 0}–{stats.L ?? 0}</p>
						<p className="td-stat-sub">Current season</p>
					</div>

					<div
						className="td-stat-card"
						style={{ border: `1px solid rgba(${secondaryRgb}, 0.28)` }}
					>
						<div
							className="td-stat-card-gradient"
							style={{ background: `linear-gradient(150deg, rgba(${primaryRgb}, 0.07) 0%, transparent 55%)` }}
						/>
						<div className="td-stat-header">
							<div className="td-stat-icon" style={{ background: `rgba(${secondaryRgb}, 0.22)` }}>
								<TrendingUp size={14} style={{ color: colors.secondary }} />
							</div>
							<span className="td-stat-label">Win %</span>
						</div>
						<p className="td-stat-value">{stats.W_PCT != null ? `${(stats.W_PCT * 100).toFixed(1)}%` : '—'}</p>
						<p className="td-stat-sub">Season win rate</p>
					</div>

					<div
						className="td-stat-card"
						style={{ border: `1px solid rgba(${secondaryRgb}, 0.28)` }}
					>
						<div
							className="td-stat-card-gradient"
							style={{ background: `linear-gradient(150deg, rgba(${primaryRgb}, 0.07) 0%, transparent 55%)` }}
						/>
						<div className="td-stat-header">
							<div className="td-stat-icon" style={{ background: `rgba(${primaryRgb}, 0.22)` }}>
								<Icon iconNode={basketball} size={14} style={{ color: colors.primary }} />
							</div>
							<span className="td-stat-label">PPG</span>
						</div>
						<p className="td-stat-value">{fmtStat(perGame(stats.PTS, stats.GP))}</p>
						<p className="td-stat-sub">Points per game</p>
					</div>

					{/* Row 2 */}
					<div
						className="td-stat-card"
						style={{ border: `1px solid rgba(${secondaryRgb}, 0.28)` }}
					>
						<div
							className="td-stat-card-gradient"
							style={{ background: `linear-gradient(150deg, rgba(${primaryRgb}, 0.07) 0%, transparent 55%)` }}
						/>
						<div className="td-stat-header">
							<div className="td-stat-icon" style={{ background: `rgba(${secondaryRgb}, 0.22)` }}>
								<ArrowUpFromLine size={14} style={{ color: colors.secondary }} />
							</div>
							<span className="td-stat-label">RPG</span>
						</div>
						<p className="td-stat-value">{fmtStat(perGame(stats.REB, stats.GP))}</p>
						<p className="td-stat-sub">Rebounds per game</p>
					</div>

					<div
						className="td-stat-card"
						style={{ border: `1px solid rgba(${secondaryRgb}, 0.28)` }}
					>
						<div
							className="td-stat-card-gradient"
							style={{ background: `linear-gradient(150deg, rgba(${primaryRgb}, 0.07) 0%, transparent 55%)` }}
						/>
						<div className="td-stat-header">
							<div className="td-stat-icon" style={{ background: `rgba(${primaryRgb}, 0.22)` }}>
								<Share2 size={14} style={{ color: colors.primary }} />
							</div>
							<span className="td-stat-label">APG</span>
						</div>
						<p className="td-stat-value">{fmtStat(perGame(stats.AST, stats.GP))}</p>
						<p className="td-stat-sub">Assists per game</p>
					</div>

					<div
						className="td-stat-card"
						style={{ border: `1px solid rgba(${secondaryRgb}, 0.28)` }}
					>
						<div
							className="td-stat-card-gradient"
							style={{ background: `linear-gradient(150deg, rgba(${primaryRgb}, 0.07) 0%, transparent 55%)` }}
						/>
						<div className="td-stat-header">
							<div className="td-stat-icon" style={{ background: `rgba(${secondaryRgb}, 0.22)` }}>
								<ShieldBan size={14} style={{ color: colors.secondary }} />
							</div>
							<span className="td-stat-label">Stocks</span>
						</div>
						<p className="td-stat-value">{fmtStat(perGame((stats.STL ?? 0) + (stats.BLK ?? 0), stats.GP))}</p>
						<p className="td-stat-sub">Steals + blocks per game</p>
					</div>

					{/* Row 3 */}
					<div
						className="td-stat-card"
						style={{ border: `1px solid rgba(${secondaryRgb}, 0.28)` }}
					>
						<div
							className="td-stat-card-gradient"
							style={{ background: `linear-gradient(150deg, rgba(${primaryRgb}, 0.07) 0%, transparent 55%)` }}
						/>
						<div className="td-stat-header">
							<div className="td-stat-icon" style={{ background: `rgba(${primaryRgb}, 0.22)` }}>
								<Crosshair size={14} style={{ color: colors.primary }} />
							</div>
							<span className="td-stat-label">FG%</span>
						</div>
						<p className="td-stat-value">{fmtPct(stats.FG_PCT)}</p>
						<p className="td-stat-sub">Field goal percentage</p>
					</div>

					<div
						className="td-stat-card"
						style={{ border: `1px solid rgba(${secondaryRgb}, 0.28)` }}
					>
						<div
							className="td-stat-card-gradient"
							style={{ background: `linear-gradient(150deg, rgba(${primaryRgb}, 0.07) 0%, transparent 55%)` }}
						/>
						<div className="td-stat-header">
							<div className="td-stat-icon" style={{ background: `rgba(${secondaryRgb}, 0.22)` }}>
								<Target size={14} style={{ color: colors.secondary }} />
							</div>
							<span className="td-stat-label">3P%</span>
						</div>
						<p className="td-stat-value">{fmtPct(stats.FG3_PCT)}</p>
						<p className="td-stat-sub">Three point percentage</p>
					</div>

					<div
						className="td-stat-card"
						style={{ border: `1px solid rgba(${secondaryRgb}, 0.28)` }}
					>
						<div
							className="td-stat-card-gradient"
							style={{ background: `linear-gradient(150deg, rgba(${primaryRgb}, 0.07) 0%, transparent 55%)` }}
						/>
						<div className="td-stat-header">
							<div className="td-stat-icon" style={{ background: `rgba(${primaryRgb}, 0.22)` }}>
								<Medal size={14} style={{ color: colors.primary }} />
							</div>
							<span className="td-stat-label">FT%</span>
						</div>
						<p className="td-stat-value">{fmtPct(stats.FT_PCT)}</p>
						<p className="td-stat-sub">Free throw percentage</p>
					</div>
				</div>

				<div
					className="td-roster-card"
					style={{ border: `1px solid rgba(${secondaryRgb}, 0.28)` }}
				>
					<h3
						className="td-roster-title"
						style={{ borderBottom: `1px solid rgba(${secondaryRgb}, 0.18)` }}
					>
						<Users size={14} />
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
													className={`td-th${col.numeric ? ' td-th--numeric' : ''}${active ? ' td-th--sorted' : ''}`}
													onClick={() => handleSort(col)}
												>
													<div className="td-th-inner">
														<span className="td-th-label">{col.label}</span>
														{active && (
															<span className="td-sort-arrow">
																{sortDir === 'asc' ? '▲' : '▼'}
															</span>
														)}
													</div>
												</th>
											);
										})}
									</tr>
								</thead>
								<tbody style={{ '--sep-color': `rgba(${secondaryRgb}, 0.08)` } as React.CSSProperties}>
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
															<div
																className="td-table-avatar"
																style={{
																	background: `rgba(${primaryRgb}, 0.2)`,
																	border: `1px solid rgba(${secondaryRgb}, 0.18)`,
																}}
															>
																<PlayerAvatar
																	playerId={player.PLAYER_ID}
																	alt={player.PLAYER ?? ''}
																	fallback={`#${player.NUM || '–'}`}
																/>
															</div>
															<div>
																<span className="td-table-name">{player.PLAYER}</span>
																<span
																	className="td-table-num"
																	style={{ color: `rgba(${secondaryRgb}, 0.55)` }}
																>
																	#{player.NUM || '–'}
																</span>
															</div>
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
