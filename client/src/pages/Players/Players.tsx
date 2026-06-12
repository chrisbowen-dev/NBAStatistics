import { useState, useEffect, useRef, useMemo } from 'react';
import {
	Box,
	Typography,
	CircularProgress,
	Collapse,
	Slider,
	Checkbox,
	FormControlLabel,
} from '@mui/material';
import { Search, Filter, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import './Players.css';

interface PlayerRow {
	id: number;
	full_name: string;
	team: string;
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
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(25);
	const [showFilters, setShowFilters] = useState(false);
	const [filters, setFilters] = useState<Filters>(() => buildFilters(FALLBACK_MAXES));
	const [showTeamDrop, setShowTeamDrop] = useState(false);
	const [teamSearch, setTeamSearch] = useState('');
	const teamDropRef = useRef<HTMLDivElement>(null);
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
					return {
						id: p.id as number,
						full_name: (p.full_name as string) ?? '',
						team: (info['TEAM_ABBREVIATION'] as string) ?? '-',
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
		setPage(0);
	}, [statMaxes]);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (teamDropRef.current && !teamDropRef.current.contains(e.target as Node)) {
				setShowTeamDrop(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, []);

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

	const activeTeams = Array.from(new Set(allRows.map(r => r.team).filter(t => t && t !== '-'))).sort();
	const allTeams = ['Free Agent', ...activeTeams];
	const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
	const visibleTeams = allTeams.filter(t => t.toLowerCase().includes(teamSearch.toLowerCase()));
	const activeFilterCount = filters.teams.length + filters.positions.length;

	const filteredRows = allRows.filter(r => {
		if (filters.teams.length) {
			const teamMatch = filters.teams.includes(r.team) ||
				(filters.teams.includes('Free Agent') && (!r.team || r.team === '-'));
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
		setPage(0);
	};

	const sortedRows = [...filteredRows].sort((a, b) => {
		const av = a[sortKey], bv = b[sortKey];
		if (typeof av === 'string' && typeof bv === 'string')
			return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
		if (typeof av === 'number' && typeof bv === 'number')
			return sortOrder === 'asc' ? av - bv : bv - av;
		return 0;
	});

	const pageCount = Math.ceil(filteredRows.length / rowsPerPage);
	const paginatedRows = sortedRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

	const SortIcon = ({ col }: { col: SortKey }) => {
		if (sortKey !== col) return <ChevronsUpDown size={14} className="pl-sort-icon-inactive" />;
		return sortOrder === 'asc'
			? <ChevronUp size={14} className="pl-sort-icon" />
			: <ChevronDown size={14} className="pl-sort-icon" />;
	};

	return (
		<div className="pl-page">
			<div className="pl-header">
				<Typography variant="h4" sx={{ fontWeight: 'bold' }} gutterBottom>Players</Typography>
				<Typography variant="body2" color="text.secondary">Browse and search NBA players</Typography>
			</div>

			<div className="pl-toolbar">
				<div className="pl-search-wrap">
					<Search size={18} className="pl-search-icon" />
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
					className={`pl-filter-btn${showFilters ? ' pl-filter-btn-active' : ''}`}
				>
					<Filter size={18} />
					<span>Filters</span>
					{activeFilterCount > 0 && (
						<span className="pl-filter-badge">{activeFilterCount}</span>
					)}
				</button>
			</div>

			{error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

			<Collapse in={showFilters}>
				<div className="pl-filter-panel">
					<div className="pl-filter-panel-header">
						<Typography sx={{ fontWeight: 600, fontSize: 14 }}>Filters</Typography>
						<button className="pl-clear-btn" onClick={() => setFilters(buildFilters(statMaxes))}>
							Clear all
						</button>
					</div>
					<div className="pl-filter-grid">
						<div>
							<label className="pl-filter-label">Teams</label>
							<div ref={teamDropRef} style={{ position: 'relative' }}>
							<button
								onClick={() => setShowTeamDrop(v => !v)}
								className="pl-dropdown-trigger"
							>
								<span className="pl-fg-muted">
									{filters.teams.length === 0 ? 'Select teams...' : `${filters.teams.length} selected`}
								</span>
								<ChevronDown size={14} className="pl-fg-muted" />
							</button>
							{showTeamDrop && (
								<div className="pl-dropdown-menu">
									<div className="pl-dropdown-search-wrap">
										<input
											type="text"
											placeholder="Search teams..."
											value={teamSearch}
											onChange={e => setTeamSearch(e.target.value)}
											className="pl-dropdown-search"
										/>
									</div>
									<div className="pl-dropdown-list">
										{visibleTeams.map(team => (
											<label key={team} className="pl-dropdown-item">
												<Checkbox
													size="small"
													checked={filters.teams.includes(team)}
													onChange={() => toggleTeam(team)}
													sx={{ p: 0.5 }}
												/>
												<span>{team}</span>
											</label>
										))}
									</div>
								</div>
							)}
							</div>
						</div>

						<div>
							<label className="pl-filter-label">Positions</label>
							<div className="pl-positions-list">
								{POSITIONS.map(pos => (
									<FormControlLabel
										key={pos}
										control={
											<Checkbox
												size="small"
												checked={filters.positions.includes(pos)}
												onChange={() => togglePosition(pos)}
												sx={{ p: 0.5 }}
											/>
										}
										label={<span className="pl-filter-label-text">{pos}</span>}
										sx={{ m: 0 }}
									/>
								))}
							</div>
						</div>

						<div className="pl-sliders">
							{([
								{ k: 'mpg', label: 'MPG', max: statMaxes.mpg, step: 0.5 },
								{ k: 'ppg', label: 'PPG', max: statMaxes.ppg, step: 0.5 },
								{ k: 'rpg', label: 'RPG', max: statMaxes.rpg, step: 0.1 },
								{ k: 'apg', label: 'APG', max: statMaxes.apg, step: 0.1 },
							] as const).map(({ k, label, max, step }) => (
								<div key={k}>
									<label className="pl-filter-label">
										{label}: {filters[k][0]} – {filters[k][1]}
									</label>
									<Slider
										size="small"
										value={filters[k]}
										onChange={(_, v) => setFilters(f => ({ ...f, [k]: v as [number, number] }))}
										min={0}
										max={max}
										step={step}
										disableSwap
										sx={{ color: '#f5f5f7' }}
									/>
								</div>
							))}
						</div>

						<div className="pl-sliders">
							{([
								{ k: 'spg', label: 'SPG', max: statMaxes.spg, step: 0.1 },
								{ k: 'bpg', label: 'BPG', max: statMaxes.bpg, step: 0.1 },
								{ k: 'fgPct', label: 'FG%', max: 100, step: 1 },
								{ k: 'fg3Pct', label: '3P%', max: 100, step: 1 },
								{ k: 'ftPct', label: 'FT%', max: 100, step: 1 },
							] as const).map(({ k, label, max, step }) => (
								<div key={k}>
									<label className="pl-filter-label">
										{label}: {filters[k][0]} – {filters[k][1]}
									</label>
									<Slider
										size="small"
										value={filters[k]}
										onChange={(_, v) => setFilters(f => ({ ...f, [k]: v as [number, number] }))}
										min={0}
										max={max}
										step={step}
										disableSwap
										sx={{ color: '#f5f5f7' }}
									/>
								</div>
							))}
						</div>
					</div>
				</div>
			</Collapse>

			{loading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
					<CircularProgress />
				</Box>
			) : (
				<>
					<div className="pl-table-card">
						<div className="pl-table-scroll">
							<table className="pl-table">
								<thead>
									<tr>
										{COLUMNS.map(col => (
											<th key={col.key} className="pl-th">
												<button
													onClick={() => handleSort(col.key)}
													className="pl-sort-btn"
												>
													{col.label}
													<SortIcon col={col.key} />
												</button>
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{paginatedRows.map(row => (
										<tr
											key={row.id}
											onClick={() => navigate(`/players/${row.id}`)}
											className="pl-row"
										>
											<td className="pl-td pl-td-name">{row.full_name}</td>
											<td className="pl-td pl-td-muted">{row.team}</td>
											<td className="pl-td pl-td-muted">{row.position}</td>
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
					</div>
					<div className="pl-pagination">
						<span className="pl-pagination-info">
							{filteredRows.length === 0
								? '0 players'
								: `${page * rowsPerPage + 1}–${Math.min((page + 1) * rowsPerPage, filteredRows.length)} of ${filteredRows.length} players`}
						</span>
						<div className="pl-pagination-controls">
							<select
								value={rowsPerPage}
								onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
								className="pl-page-size"
							>
								<option value={25}>25 / page</option>
								<option value={50}>50 / page</option>
								<option value={100}>100 / page</option>
							</select>
							<button
								onClick={() => setPage(p => p - 1)}
								disabled={page === 0}
								className="pl-page-btn"
							>
								‹
							</button>
							<span className="pl-pagination-info">
								{pageCount === 0 ? '0 / 0' : `${page + 1} / ${pageCount}`}
							</span>
							<button
								onClick={() => setPage(p => p + 1)}
								disabled={page >= pageCount - 1}
								className="pl-page-btn"
							>
								›
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
