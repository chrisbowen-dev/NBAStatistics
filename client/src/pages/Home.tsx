import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import Players from './Players';
import Teams from './Teams';

export default function Home() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: 3 }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Players" />
        <Tab label="Teams" />
      </Tabs>
      {tab === 0 && <Players />}
      {tab === 1 && <Teams />}
    </Box>
  );
}
