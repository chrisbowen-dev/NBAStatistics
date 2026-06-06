import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
	Box,
	Typography,
	CircularProgress,
	Paper,
	Grid,
	Button,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { api } from '../../api/client';
import { TeamDetail as TeamDetailType, RosterPlayer } from '../../types/team';

export default function TeamDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [team, setTeam] = useState<TeamDetailType | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!id) return;
		setLoading(true);
		setError('');
		api.get<TeamDetailType>(`/teams/${id}`)
			.then(({ data }) => setTeam(data))
			.catch(() => setError('Failed to load team. Make sure the server is running.'))
			.finally(() => setLoading(false));
	}, [id]);

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error || !team) {
		return (
			<Box sx={{ p: 3 }}>
				<Typography color="error">{error || 'Team not found.'}</Typography>
				<Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Back to Home</Button>
			</Box>
		);
	}

	const stats = team.currentSeasonStats;
	const wins = (stats.W as number) ?? (stats.wins as number) ?? '-';
	const losses = (stats.L as number) ?? (stats.losses as number) ?? '-';
	const winPct = (stats.W_PCT as number) ?? (stats.winPct as number);
	const pts = (stats.PTS as number) ?? (stats.pts as number);
	const reb = (stats.REB as number) ?? (stats.reb as number);
	const ast = (stats.AST as number) ?? (stats.ast as number);

	const roster: RosterPlayer[] = (team.roster || []) as RosterPlayer[];
	const rosterRows = roster.map((p, i) => ({ ...p, id: p.PLAYER_ID ?? i }));

	const rosterColumns: GridColDef[] = [
		{
			field: 'PLAYER',
			headerName: 'Player',
			flex: 1.5,
			minWidth: 160,
			renderCell: (params: GridRenderCellParams) => (
				<Link
					to={`/players/${params.row.PLAYER_ID}`}
					style={{ color: 'inherit', textDecoration: 'underline' }}
					onClick={(e) => e.stopPropagation()}
				>
					{params.value as string}
				</Link>
			),
		},
		{ field: 'NUM', headerName: '#', width: 60 },
		{ field: 'POSITION', headerName: 'Position', width: 100 },
		{ field: 'AGE', headerName: 'Age', width: 70, type: 'number' },
		{ field: 'HOW_ACQUIRED', headerName: 'How Acquired', flex: 1, minWidth: 130 },
	];

	return (
		<Box sx={{ p: 3 }}>
			<Button onClick={() => navigate('/')} sx={{ mb: 2 }}>
				Back
			</Button>

			<Typography variant="h4" gutterBottom>
				{team.full_name}
			</Typography>
			<Typography variant="subtitle1" color="text.secondary" gutterBottom>
				{team.city} &middot; Est. {team.year_founded}
			</Typography>

			<Paper sx={{ p: 2, mb: 3 }}>
				<Typography variant="h6" gutterBottom>Season Stats</Typography>
				<Grid container spacing={2}>
					<Grid size={{ xs: 6, sm: 3 }}>
						<Typography variant="body2" color="text.secondary">Record</Typography>
						<Typography variant="h6">{wins}&ndash;{losses}</Typography>
					</Grid>
					{winPct != null && (
						<Grid size={{ xs: 6, sm: 3 }}>
							<Typography variant="body2" color="text.secondary">Win %</Typography>
							<Typography variant="h6">
								{typeof winPct === 'number' ? (winPct * 100).toFixed(1) + '%' : String(winPct)}
							</Typography>
						</Grid>
					)}
					{pts != null && (
						<Grid size={{ xs: 6, sm: 3 }}>
							<Typography variant="body2" color="text.secondary">PPG</Typography>
							<Typography variant="h6">
								{typeof pts === 'number' ? pts.toFixed(1) : String(pts)}
							</Typography>
						</Grid>
					)}
					{reb != null && (
						<Grid size={{ xs: 6, sm: 3 }}>
							<Typography variant="body2" color="text.secondary">RPG</Typography>
							<Typography variant="h6">
								{typeof reb === 'number' ? reb.toFixed(1) : String(reb)}
							</Typography>
						</Grid>
					)}
					{ast != null && (
						<Grid size={{ xs: 6, sm: 3 }}>
							<Typography variant="body2" color="text.secondary">APG</Typography>
							<Typography variant="h6">
								{typeof ast === 'number' ? ast.toFixed(1) : String(ast)}
							</Typography>
						</Grid>
					)}
					<Grid size={{ xs: 6, sm: 3 }}>
						<Typography variant="body2" color="text.secondary">Abbreviation</Typography>
						<Typography variant="h6">{team.abbreviation}</Typography>
					</Grid>
				</Grid>
			</Paper>

			<Typography variant="h6" gutterBottom>Roster</Typography>
			{rosterRows.length === 0 ? (
				<Typography color="text.secondary">No roster data available.</Typography>
			) : (
				<Box sx={{ height: 500 }}>
					<DataGrid
						rows={rosterRows}
						columns={rosterColumns}
						initialState={{
							pagination: { paginationModel: { pageSize: 25 } },
						}}
						pageSizeOptions={[25]}
						onRowClick={(params) => navigate(`/players/${params.row.PLAYER_ID}`)}
						sx={{ cursor: 'pointer' }}
						disableRowSelectionOnClick
					/>
				</Box>
			)}
		</Box>
	);
}
