import { AppBar, Toolbar, Box, Typography } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Users2 } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
	const location = useLocation();

	const isActive = (path: string) => {
		if (path === '/' && location.pathname === '/') return true;
		if (path !== '/' && location.pathname.startsWith(path)) return true;
		return false;
	};

	const navLinks = [
		{ to: '/', icon: <Home size={16} />, label: 'Home' },
		{ to: '/players', icon: <Users size={16} />, label: 'Players' },
		{ to: '/teams', icon: <Users2 size={16} />, label: 'Teams' },
	];

	return (
		<AppBar position="sticky" elevation={0} className="navbar">
			<Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
				<Typography
					component={Link}
					to="/"
					sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 600, fontSize: '1.1rem' }}
				>
					NBA Statistics
				</Typography>

				<Box sx={{ display: 'flex', gap: 0.5 }}>
					{navLinks.map(({ to, icon, label }) => (
						<Box
							key={to}
							component={Link}
							to={to}
							className={`nav-link${isActive(to) ? ' nav-link--active' : ''}`}
						>
							{icon}
							<span>{label}</span>
						</Box>
					))}
				</Box>
			</Toolbar>
		</AppBar>
	);
}
