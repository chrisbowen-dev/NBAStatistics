import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import Home from './pages/Home/Home';
import PlayerDetail from './pages/PlayerDetail/PlayerDetail';
import TeamDetail from './pages/TeamDetail/TeamDetail';
import Navbar from './components/Navbar/Navbar';

const darkTheme = createTheme({
	palette: {
		mode: 'dark',
		background: {
			default: '#1c1c1f',
			paper: '#2c2c30',
		},
		text: {
			primary: '#f5f5f7',
			secondary: '#8e8e99',
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
					<Route path="/players/:id" element={<PlayerDetail />} />
					<Route path="/teams/:id" element={<TeamDetail />} />
				</Routes>
			</BrowserRouter>
		</ThemeProvider>
	);
}

export default App;
