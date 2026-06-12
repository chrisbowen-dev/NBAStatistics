import { Box, Typography } from '@mui/material';

export default function Home() {
	return (
		<Box sx={{ p: 4, textAlign: 'center' }}>
			<Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
				NBA Statistics
			</Typography>
			<Typography variant="body1" sx={{ color: 'text.secondary' }}>
				Browse players and teams using the navigation above.
			</Typography>
		</Box>
	);
}
