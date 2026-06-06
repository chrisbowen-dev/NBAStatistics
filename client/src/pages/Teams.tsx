import { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Team } from '../types/team';

const columns: GridColDef[] = [
  { field: 'full_name', headerName: 'Team Name', flex: 1.5, minWidth: 180 },
  { field: 'abbreviation', headerName: 'Abbr.', flex: 0.6, minWidth: 70 },
  { field: 'city', headerName: 'City', flex: 1, minWidth: 120 },
  { field: 'state', headerName: 'State', flex: 1, minWidth: 120 },
  { field: 'year_founded', headerName: 'Founded', flex: 0.7, minWidth: 90, type: 'number' },
];

export default function Teams() {
  const [rows, setRows] = useState<Team[]>([]);
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
    <Box sx={{ height: 600 }}>
      <DataGrid
        rows={rows}
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
  );
}
