import { useState, useEffect, useMemo } from 'react';
import { Slider } from '@mui/material';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import TeamsDropdown from '../../components/TeamsDropdown/TeamsDropdown';
import './Players.css';

interface PlayerRow {
	id: number;
	full_name: string;
	team: string;
	teamId: number;
	teams: string[];
	position: string;
	jersey: string;
	mpg: number;
	ppg: number;
	rpg: number;
	apg: number;
	spg: number;
	bpg: number;
	fgPct: number;
	fg3Pct: number;
	ftPct: number;
	hasStats: boolean;
}

type SortKey = keyof PlayerRow;
type SortOrder = 'asc' | 'desc';

interface Filters {
	teams: string[];
	positions: string[];
	mpg: [number, number];
	ppg: [number, number];
	rpg: [number, number];
	apg: [number, number];
	spg: [number, number];
	bpg: [number, number];
	fgPct: [number, number];
	fg3Pct: [number, number];
	ftPct: [number, number];
}

type StatMaxes = { mpg: number; ppg: number; rpg: number; apg: number; spg: number; bpg: number };

function buildFilters(maxes: StatMaxes): Filters {
	return {
		teams: [],
		positions: [],
		mpg: [0, maxes.mpg],
		ppg: [0, maxes.ppg],
		rpg: [0, maxes.rpg],
		apg: [0, maxes.apg],
		spg: [0, maxes.spg],
		bpg: [0, maxes.bpg],
		fgPct: [0, 100],
		fg3Pct: [0, 100],
		ftPct: [0, 100],
	};
}

const FALLBACK_MAXES: StatMaxes = { mpg: 48, ppg: 50, rpg: 15, apg: 15, spg: 5, bpg: 5 };

const COLUMNS: { key: SortKey; label: string }[] = [
	{ key: 'full_name', label: 'Name' },
	{ key: 'team', label: 'Team' },
	{ key: 'position', label: 'Pos' },
	{ key: 'mpg', label: 'MPG' },
	{ key: 'ppg', label: 'PPG' },
	{ key: 'rpg', label: 'RPG' },
	{ key: 'apg', label: 'APG' },
	{ key: 'spg', label: 'SPG' },
	{ key: 'bpg', label: 'BPG' },
	{ key: 'fgPct', label: 'FG%' },
	{ key: 'fg3Pct', label: '3P%' },
	{ key: 'ftPct', label: 'FT%' },
];

const PAGE_SIZE = 25;

const TEAM_ID_MAP: Record<string, number> = {
	ATL: 1610612737,
	BOS: 1610612738,
	BKN: 1610612751,
	CHA: 1610612766,
	CHI: 1610612741,
	CLE: 1610612739,
	DAL: 1610612742,
	DEN: 1610612743,
	DET: 1610612765,
	GSW: 1610612744,
	HOU: 1610612745,
	IND: 1610612754,
	LAC: 1610612746,
	LAL: 1610612747,
	MEM: 1610612763,
	MIA: 1610612748,
	MIL: 1610612749,
	MIN: 1610612750,
	NOP: 1610612740,
	NYK: 1610612752,
	OKC: 1610612760,
	ORL: 1610612753,
	PHI: 1610612755,
	PHX: 1610612756,
	POR: 1610612757,
	SAC: 1610612758,
	SAS: 1610612759,
	TOR: 1610612761,
	UTA: 1610612762,
	WAS: 1610612764,
};

function toNum(v: unknown): number {
	return typeof v === 'number' ? v : parseFloat(String(v ?? 0)) || 0;
}

export default function Players() {
	const [search, setSearch] = useState('');
	const [allRows, setAllRows] = useState<PlayerRow[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [sortKey, setSortKey] = useState<SortKey>('ppg');
	const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
	const [visibleCount, setVisibleCount] = useState(25);
	const [showFilters, setShowFilters] = useState(false);
	const [filters, setFilters] = useState<Filters>(() => buildFilters(FALLBACK_MAXES));
	const navigate = useNavigate();

	useEffect(() => {
		const t = setTimeout(async () => {
			setLoading(true);
			setError('');
			try {
				const { data } = await api.get('/players', { params: { name: search } });
				const rows: PlayerRow[] = data.map((p: Record<string, unknown>) => {
					const info = (p.info as Record<string, unknown>) ?? {};
					const careerStats = p.careerStats as Record<string, unknown>[] | undefined;
					const season = careerStats?.length ? careerStats[careerStats.length - 1] : null;

					const infoTeam = (info['TEAM_ABBREVIATION'] as string) ?? '';
					const isTOT = infoTeam === 'TOT' || (season && season['TEAM_ABBREVIATION'] === 'TOT');
					let teamDisplay = infoTeam && infoTeam !== 'TOT' ? infoTeam : '-';
					let teams: string[] = teamDisplay !== '-' ? [teamDisplay] : [];
					if (isTOT && careerStats?.length) {
						const seasonId = (season ?? careerStats[careerStats.length - 1])['SEASON_ID'];
						const parts = careerStats.filter(
							r => r['SEASON_ID'] === seasonId && r['TEAM_ABBREVIATION'] !== 'TOT'
						);
						if (parts.length > 0) {
							teams = parts.map(r => r['TEAM_ABBREVIATION'] as string);
							teamDisplay = teams.join(', ');
						}
					}

					return {
						id: p.id as number,
						full_name: (p.full_name as string) ?? '',
						team: teamDisplay,
						teamId: (info['TEAM_ID'] as number) ?? 0,
						teams,
						position: (info['POSITION'] as string) ?? '-',
						jersey: (info['JERSEY'] as string) ?? '-',
						mpg: season ? toNum(season['MIN']) : 0,
						ppg: season ? toNum(season['PTS']) : 0,
						rpg: season ? toNum(season['REB']) : 0,
						apg: season ? toNum(season['AST']) : 0,
						spg: season ? toNum(season['STL']) : 0,
						bpg: season ? toNum(season['BLK']) : 0,
						fgPct: season ? Math.round(toNum(season['FG_PCT']) * 1000) / 10 : 0,
						fg3Pct: season ? Math.round(toNum(season['FG3_PCT']) * 1000) / 10 : 0,
						ftPct: season ? Math.round(toNum(season['FT_PCT']) * 1000) / 10 : 0,
						hasStats: !!season,
					};
				});
				setAllRows(rows);
			} catch {
				setError('Failed to load players. Make sure the server is running.');
				setAllRows([]);
			} finally {
				setLoading(false);
			}
		}, 300);
		return () => clearTimeout(t);
	}, [search]);

	const statMaxes = useMemo((): StatMaxes => {
		const withStats = allRows.filter(r => r.hasStats);
		if (!withStats.length) return FALLBACK_MAXES;
		const peak = (key: keyof PlayerRow) =>
			Math.ceil(Math.max(...withStats.map(r => r[key] as number)));
		return {
			mpg: peak('mpg'),
			ppg: peak('ppg'),
			rpg: peak('rpg'),
			apg: peak('apg'),
			spg: Math.ceil(Math.max(...withStats.map(r => r.spg)) * 10) / 10,
			bpg: Math.ceil(Math.max(...withStats.map(r => r.bpg)) * 10) / 10,
		};
	}, [allRows]);

	useEffect(() => {
		setFilters(buildFilters(statMaxes));
	}, [statMaxes]);

	useEffect(() => {
		setVisibleCount(25);
	}, [search, filters, sortKey, sortOrder]);

	const toggleTeam = (team: string) =>
		setFilters(f => ({
			...f,
			teams: f.teams.includes(team) ? f.teams.filter(t => t !== team) : [...f.teams, team],
		}));

	const togglePosition = (pos: string) =>
		setFilters(f => ({
			...f,
			positions: f.positions.includes(pos) ? f.positions.filter(p => p !== pos) : [...f.positions, pos],
		}));

	const activeTeams = Array.from(new Set(allRows.flatMap(r => r.teams))).sort();
	const allTeams = [...activeTeams];
	const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
	const activeFilterCount = filters.teams.length + filters.positions.length;

	const filteredRows = allRows.filter(r => {
		if (filters.teams.length) {
			const isFreeAgent = r.teams.length === 0;
			const teamMatch = filters.teams.some(t => r.teams.includes(t)) ||
				(filters.teams.includes('Free Agent') && isFreeAgent);
			if (!teamMatch) return false;
		}
		if (filters.positions.length) {
			const raw = r.position.toLowerCase();
			const matchesPos = (p: string) => {
				if (p === 'PG' || p === 'SG') return raw.includes('guard');
				if (p === 'SF' || p === 'PF') return raw.includes('forward');
				if (p === 'C') return raw.includes('center');
				return false;
			};
			if (!filters.positions.some(matchesPos)) return false;
		}
		if (r.mpg < filters.mpg[0] || r.mpg > filters.mpg[1]) return false;
		if (r.ppg < filters.ppg[0] || r.ppg > filters.ppg[1]) return false;
		if (r.rpg < filters.rpg[0] || r.rpg > filters.rpg[1]) return false;
		if (r.apg < filters.apg[0] || r.apg > filters.apg[1]) return false;
		if (r.spg < filters.spg[0] || r.spg > filters.spg[1]) return false;
		if (r.bpg < filters.bpg[0] || r.bpg > filters.bpg[1]) return false;
		if (r.fgPct < filters.fgPct[0] || r.fgPct > filters.fgPct[1]) return false;
		if (r.fg3Pct < filters.fg3Pct[0] || r.fg3Pct > filters.fg3Pct[1]) return false;
		if (r.ftPct < filters.ftPct[0] || r.ftPct > filters.ftPct[1]) return false;
		return true;
	});

	const handleSort = (key: SortKey) => {
		if (sortKey === key) {
			setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
		} else {
			setSortKey(key);
			setSortOrder('asc');
		}
	};

	const sortedRows = [...filteredRows].sort((a, b) => {
		const av = a[sortKey], bv = b[sortKey];
		if (typeof av === 'string' && typeof bv === 'string')
			return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
		if (typeof av === 'number' && typeof bv === 'number')
			return sortOrder === 'asc' ? av - bv : bv - av;
		return 0;
	});

	const visibleRows = sortedRows.slice(0, visibleCount);
	const hasMore = visibleCount < sortedRows.length;

	return (
		<div className="pl-page">
			<h1 className="pl-page-title">Players</h1>
			<p className="pl-page-sub">Browse and search NBA players</p>

			<div className="pl-toolbar">
				<div className="pl-search-wrap">
					<Search size={15} className="pl-search-icon" />
					<input
						type="text"
						placeholder="Search players by name, team, or position..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						className="pl-search-input"
					/>
				</div>
				<button
					onClick={() => setShowFilters(v => !v)}
					className={`pl-filter-btn${showFilters ? ' pl-filter-btn--open' : ''}`}
				>
					<SlidersHorizontal size={15} />
					Filters
					{activeFilterCount > 0 && (
						<span className="pl-filter-badge">{activeFilterCount}</span>
					)}
				</button>
			</div>

			{error && <p className="pl-error">{error}</p>}

			<div className={`pl-layout ${showFilters ? 'pl-layout--sidebar-open' : 'pl-layout--sidebar-closed'}`}>
				<div className="pl-sidebar-wrap">
					<div className="pl-sidebar">
						<div className="pl-sidebar-header">
							<span className="pl-sidebar-title">Filters</span>
							<button className="pl-clear-btn" onClick={() => setFilters(buildFilters(statMaxes))}>
								Clear all
							</button>
						</div>

						<div className="pl-sidebar-section">
							<div className="pl-filter-label">Teams</div>
							<TeamsDropdown
								teams={allTeams}
								teamIdMap={TEAM_ID_MAP}
								selected={filters.teams}
								onToggle={toggleTeam}
							/>
						</div>

						<div className="pl-sidebar-divider" />

						<div className="pl-sidebar-section">
							<div className="pl-filter-label">Position</div>
							<div className="pl-pill-group">
								{POSITIONS.map(pos => (
									<button
										key={pos}
										className={`pl-pill${filters.positions.includes(pos) ? ' pl-pill--active' : ''}`}
										onClick={() => togglePosition(pos)}
									>
										{pos}
									</button>
								))}
							</div>
						</div>

						<div className="pl-sidebar-divider" />

						<div className="pl-sidebar-section">
							<div className="pl-filter-label">Scoring</div>
							{(['ppg', 'apg', 'rpg'] as const).map(k => (
								<div key={k} className="pl-slider-wrap">
									<div className="pl-slider-label">
										<span>{k.toUpperCase()}</span>
										<span>{filters[k][0]} – {filters[k][1]}</span>
									</div>
									<Slider
										size="small"
										value={filters[k]}
										onChange={(_, v) => setFilters(f => ({ ...f, [k]: v as [number, number] }))}
										min={0}
										max={statMaxes[k]}
										step={0.5}
										disableSwap
										sx={{
											color: 'rgba(255,255,255,0.5)',
											'& .MuiSlider-thumb': { width: 11, height: 11, backgroundColor: '#fff' },
											'& .MuiSlider-track': { backgroundColor: 'rgba(255,255,255,0.35)', border: 'none' },
											'& .MuiSlider-rail': { backgroundColor: 'rgba(255,255,255,0.1)' },
										}}
									/>
								</div>
							))}
						</div>

						<div className="pl-sidebar-divider" />

						<div className="pl-sidebar-section">
							<div className="pl-filter-label">Defense</div>
							{(['spg', 'bpg', 'mpg'] as const).map(k => (
								<div key={k} className="pl-slider-wrap">
									<div className="pl-slider-label">
										<span>{k.toUpperCase()}</span>
										<span>{filters[k][0]} – {filters[k][1]}</span>
									</div>
									<Slider
										size="small"
										value={filters[k]}
										onChange={(_, v) => setFilters(f => ({ ...f, [k]: v as [number, number] }))}
										min={0}
										max={statMaxes[k]}
										step={0.1}
										disableSwap
										sx={{
											color: 'rgba(255,255,255,0.5)',
											'& .MuiSlider-thumb': { width: 11, height: 11, backgroundColor: '#fff' },
											'& .MuiSlider-track': { backgroundColor: 'rgba(255,255,255,0.35)', border: 'none' },
											'& .MuiSlider-rail': { backgroundColor: 'rgba(255,255,255,0.1)' },
										}}
									/>
								</div>
							))}
						</div>

						<div className="pl-sidebar-divider" />

						<div className="pl-sidebar-section">
							<div className="pl-filter-label">Shooting %</div>
							{(['fgPct', 'fg3Pct', 'ftPct'] as const).map(k => (
								<div key={k} className="pl-slider-wrap">
									<div className="pl-slider-label">
										<span>{{ fgPct: 'FG%', fg3Pct: '3P%', ftPct: 'FT%' }[k]}</span>
										<span>{filters[k][0]} – {filters[k][1]}</span>
									</div>
									<Slider
										size="small"
										value={filters[k]}
										onChange={(_, v) => setFilters(f => ({ ...f, [k]: v as [number, number] }))}
										min={0}
										max={100}
										step={1}
										disableSwap
										sx={{
											color: 'rgba(255,255,255,0.5)',
											'& .MuiSlider-thumb': { width: 11, height: 11, backgroundColor: '#fff' },
											'& .MuiSlider-track': { backgroundColor: 'rgba(255,255,255,0.35)', border: 'none' },
											'& .MuiSlider-rail': { backgroundColor: 'rgba(255,255,255,0.1)' },
										}}
									/>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="pl-main">
					{loading ? (
						<div className="pl-loading">
							<div className="pl-spinner" />
						</div>
					) : (
						<div className="pl-table-card">
							<div className="pl-table-scroll">
								<table className="pl-table">
									<thead>
										<tr>
											{COLUMNS.map(col => (
												<th
													key={col.key}
													className={`pl-th${sortKey === col.key ? ' pl-th--sorted' : ''}`}
													onClick={() => handleSort(col.key)}
												>
													<div className="pl-th-inner">
														<span className="pl-th-label">{col.label}</span>
														{sortKey === col.key && (
															<span className="pl-sort-arrow">
																{sortOrder === 'desc' ? '▼' : '▲'}
															</span>
														)}
													</div>
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{visibleRows.map(row => (
											<tr
												key={row.id}
												onClick={() => navigate(`/players/${row.id}`)}
												className="pl-row"
											>
												<td className="pl-td pl-td-name">{row.full_name}</td>
												<td className="pl-td pl-td-team">{row.team}</td>
												<td className="pl-td pl-td-pos">{row.position}</td>
												<td className="pl-td">{row.hasStats ? row.mpg : '-'}</td>
												<td className="pl-td">{row.hasStats ? row.ppg : '-'}</td>
												<td className="pl-td">{row.hasStats ? row.rpg : '-'}</td>
												<td className="pl-td">{row.hasStats ? row.apg : '-'}</td>
												<td className="pl-td">{row.hasStats ? row.spg : '-'}</td>
												<td className="pl-td">{row.hasStats ? row.bpg : '-'}</td>
												<td className="pl-td">{row.hasStats ? `${row.fgPct}%` : '-'}</td>
												<td className="pl-td">{row.hasStats ? `${row.fg3Pct}%` : '-'}</td>
												<td className="pl-td">{row.hasStats ? `${row.ftPct}%` : '-'}</td>
											</tr>
										))}
										{sortedRows.length === 0 && (
											<tr>
												<td colSpan={COLUMNS.length} className="pl-empty">
													No players found matching your search and filters.
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
							<div className="pl-load-more-wrap">
								{hasMore && (
									<button
										className="pl-load-more-btn"
										onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
									>
										Load more players
									</button>
								)}
								<span className="pl-load-more-count">
									{sortedRows.length === 0
										? '0 players'
										: hasMore
											? `Showing ${visibleCount} of ${sortedRows.length} players`
											: `All ${sortedRows.length} players loaded`}
								</span>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
