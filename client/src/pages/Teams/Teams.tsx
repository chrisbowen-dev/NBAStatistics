import { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Team } from '../../types/team';
import './Teams.css';

const columns: GridColDef[] = [
	{ field: 'full_name', headerName: 'Team Name', flex: 1.5, minWidth: 180 },
	{ field: 'abbreviation', headerName: 'Abbr.', flex: 0.6, minWidth: 70 },
	{ field: 'city', headerName: 'City', flex: 1, minWidth: 120 },
	{ field: 'state', headerName: 'State', flex: 1, minWidth: 120 },
];

export default function Teams() {
	const [rows, setRows] = useState<Team[]>([]);
	const [search, setSearch] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const navigate = useNavigate();

	useEffect(() => {
		api.get<Team[]>('/teams')
			.then(({ data }) => {
				setRows(data);
			})
			.catch(() => {
				setError('Failed to load teams. Make sure the server is running.');
			})
			.finally(() => setLoading(false));
	}, []);

	const handleRowClick = (params: GridRowParams) => {
		navigate(`/teams/${params.row.id}`);
	};

	const filteredRows = rows.filter(t => {
		const q = search.toLowerCase();
		return (
			t.full_name.toLowerCase().includes(q) ||
			t.city.toLowerCase().includes(q) ||
			t.abbreviation.toLowerCase().includes(q) ||
			t.state.toLowerCase().includes(q)
		);
	});

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return <Typography color="error">{error}</Typography>;
	}

	return (
		<div className="tm-page">
			<div className="tm-header">
				<Typography variant="h4" sx={{ fontWeight: 'bold' }} gutterBottom>Teams</Typography>
				<Typography variant="body2" color="text.secondary">Browse and search NBA teams</Typography>
			</div>

			<div className="tm-toolbar">
				<div className="tm-search-wrap">
					<Search size={18} className="tm-search-icon" />
					<input
						type="text"
						placeholder="Search teams by name, city, or state..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						className="tm-search-input"
					/>
				</div>
			</div>

			<Box sx={{ height: 600 }}>
				<DataGrid
					rows={filteredRows}
					columns={columns}
					initialState={{
						pagination: { paginationModel: { pageSize: 30 } },
					}}
					pageSizeOptions={[30]}
					onRowClick={handleRowClick}
					sx={{ cursor: 'pointer' }}
					disableRowSelectionOnClick
				/>
			</Box>
		</div>
	);
}
