import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import Home from './pages/Home/Home';
import Players from './pages/Players/Players';
import PlayerDetail from './pages/PlayerDetail/PlayerDetail';
import Teams from './pages/Teams/Teams';
import TeamDetail from './pages/TeamDetail/TeamDetail';
import Navbar from './components/Navbar/Navbar';

const darkTheme = createTheme({
	palette: {
		mode: 'dark',
		background: {
			default: '#0a0a0a',
			paper: '#262626',
		},
		text: {
			primary: '#fafafa',
			secondary: '#a1a1a1',
		},
	},
});

function App() {
	return (
		<ThemeProvider theme={darkTheme}>
			<CssBaseline />
			<BrowserRouter>
				<Navbar />
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/players" element={<Players />} />
					<Route path="/players/:id" element={<PlayerDetail />} />
					<Route path="/teams" element={<Teams />} />
					<Route path="/teams/:id" element={<TeamDetail />} />
				</Routes>
			</BrowserRouter>
		</ThemeProvider>
	);
}

export default App;
