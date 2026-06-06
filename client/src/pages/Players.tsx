import { useState, useEffect } from 'react';
import { Box, TextField, CircularProgress, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

interface PlayerRow {
  id: number;
  full_name: string;
  team: string;
  position: string;
  pts: number | string;
  reb: number | string;
  ast: number | string;
}

const columns: GridColDef[] = [
  { field: 'full_name', headerName: 'Name', flex: 1.5, minWidth: 150 },
  { field: 'team', headerName: 'Team', flex: 0.8, minWidth: 80 },
  { field: 'position', headerName: 'Position', flex: 0.8, minWidth: 90 },
  { field: 'pts', headerName: 'PPG', flex: 0.6, minWidth: 70, type: 'number' },
  { field: 'reb', headerName: 'RPG', flex: 0.6, minWidth: 70, type: 'number' },
  { field: 'ast', headerName: 'APG', flex: 0.6, minWidth: 70, type: 'number' },
];

export default function Players() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/players', { params: { name: search } });
        const mapped: PlayerRow[] = data.map((p: Record<string, unknown>) => {
          const info = (p.info as Record<string, unknown>) || {};
          const careerStats = p.careerStats as Record<string, unknown>[] | undefined;
          const currentSeason = careerStats && careerStats.length > 0
            ? careerStats[careerStats.length - 1]
            : null;
          const pts = currentSeason
            ? ((currentSeason.PTS as number) / Math.max(currentSeason.GP as number, 1)).toFixed(1)
            : '-';
          const reb = currentSeason
            ? ((currentSeason.REB as number) / Math.max(currentSeason.GP as number, 1)).toFixed(1)
            : '-';
          const ast = currentSeason
            ? ((currentSeason.AST as number) / Math.max(currentSeason.GP as number, 1)).toFixed(1)
            : '-';
          return {
            id: p.id as number,
            full_name: (p.full_name as string) || '',
            team: (info.TEAM_ABBREVIATION as string) || '-',
            position: (info.POSITION as string) || '-',
            pts,
            reb,
            ast,
          };
        });
        setRows(mapped);
      } catch {
        setError('Failed to load players. Make sure the server is running.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleRowClick = (params: GridRowParams) => {
    navigate(`/players/${params.row.id}`);
  };

  return (
    <Box>
      <TextField
        label="Search players"
        variant="outlined"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
        placeholder="e.g. LeBron James"
      />
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ height: 500 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            pageSizeOptions={[25, 50]}
            onRowClick={handleRowClick}
            sx={{ cursor: 'pointer' }}
            disableRowSelectionOnClick
          />
        </Box>
      )}
    </Box>
  );
}
