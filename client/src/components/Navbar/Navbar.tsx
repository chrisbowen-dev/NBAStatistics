import { AppBar, Toolbar, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function Navbar() {
	return (
		<AppBar position="static">
			<Toolbar>
				<Typography
					variant="h6"
					component={Link}
					to="/"
					sx={{ textDecoration: 'none', color: 'inherit' }}
				>
					NBA Statistics
				</Typography>
			</Toolbar>
		</AppBar>
	);
}
