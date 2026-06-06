import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Chip,
  Paper,
  Grid,
  Button,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { api } from '../api/client';
import { Player, CareerStatSeason } from '../types/player';

const careerColumns: GridColDef[] = [
  { field: 'SEASON_ID', headerName: 'Season', width: 100 },
  { field: 'TEAM_ABBREVIATION', headerName: 'Team', width: 80 },
  { field: 'GP', headerName: 'GP', width: 70, type: 'number' },
  {
    field: 'PTS', headerName: 'PTS', width: 80, type: 'number',
    valueFormatter: (value: number) => value?.toFixed(1) ?? '-',
  },
  {
    field: 'REB', headerName: 'REB', width: 80, type: 'number',
    valueFormatter: (value: number) => value?.toFixed(1) ?? '-',
  },
  {
    field: 'AST', headerName: 'AST', width: 80, type: 'number',
    valueFormatter: (value: number) => value?.toFixed(1) ?? '-',
  },
  {
    field: 'STL', headerName: 'STL', width: 80, type: 'number',
    valueFormatter: (value: number) => value?.toFixed(1) ?? '-',
  },
  {
    field: 'BLK', headerName: 'BLK', width: 80, type: 'number',
    valueFormatter: (value: number) => value?.toFixed(1) ?? '-',
  },
  {
    field: 'FG_PCT', headerName: 'FG%', width: 80, type: 'number',
    valueFormatter: (value: number) => value != null ? (value * 100).toFixed(1) + '%' : '-',
  },
  {
    field: 'FG3_PCT', headerName: '3P%', width: 80, type: 'number',
    valueFormatter: (value: number) => value != null ? (value * 100).toFixed(1) + '%' : '-',
  },
  {
    field: 'FT_PCT', headerName: 'FT%', width: 80, type: 'number',
    valueFormatter: (value: number) => value != null ? (value * 100).toFixed(1) + '%' : '-',
  },
];

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    api.get<Player>(`/players/${id}`)
      .then(({ data }) => setPlayer(data))
      .catch(() => setError('Failed to load player. Make sure the server is running.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !player) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error || 'Player not found.'}</Typography>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>Back to Home</Button>
      </Box>
    );
  }

  const info = player.info || ({} as Record<string, string>);
  const careerRows = (player.careerStats || []).map(
    (s: CareerStatSeason, i: number) => ({ ...s, id: i })
  ).reverse();

  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={() => navigate('/')} sx={{ mb: 2 }}>
        Back
      </Button>

      <Typography variant="h4" gutterBottom>
        {player.full_name || info.DISPLAY_FIRST_LAST || 'Unknown Player'}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {info.TEAM_NAME && <Chip label={info.TEAM_NAME} color="primary" />}
        {info.TEAM_ABBREVIATION && <Chip label={info.TEAM_ABBREVIATION} variant="outlined" />}
        {info.POSITION && <Chip label={`Position: ${info.POSITION}`} variant="outlined" />}
        {info.JERSEY && <Chip label={`#${info.JERSEY}`} variant="outlined" />}
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Bio</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="body2" color="text.secondary">Height</Typography>
            <Typography>{info.HEIGHT || '-'}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="body2" color="text.secondary">Weight</Typography>
            <Typography>{info.WEIGHT ? `${info.WEIGHT} lbs` : '-'}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="body2" color="text.secondary">Birthdate</Typography>
            <Typography>{info.BIRTHDATE ? info.BIRTHDATE.split('T')[0] : '-'}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="body2" color="text.secondary">Country</Typography>
            <Typography>{info.COUNTRY || '-'}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="body2" color="text.secondary">School</Typography>
            <Typography>{info.SCHOOL || '-'}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Typography variant="body2" color="text.secondary">Draft</Typography>
            <Typography>
              {info.DRAFT_YEAR && info.DRAFT_YEAR !== '0'
                ? `${info.DRAFT_YEAR} R${info.DRAFT_ROUND} Pick ${info.DRAFT_NUMBER}`
                : 'Undrafted'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom>Career Stats</Typography>
      {careerRows.length === 0 ? (
        <Typography color="text.secondary">No career stats available.</Typography>
      ) : (
        <Box sx={{ height: 400 }}>
          <DataGrid
            rows={careerRows}
            columns={careerColumns}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            pageSizeOptions={[25, 50]}
            disableRowSelectionOnClick
          />
        </Box>
      )}
    </Box>
  );
}
