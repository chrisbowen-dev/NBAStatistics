import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import PlayerDetail from './pages/PlayerDetail/PlayerDetail';
import TeamDetail from './pages/TeamDetail/TeamDetail';
import Navbar from './components/Navbar/Navbar';

function App() {
	return (
		<BrowserRouter>
			<Navbar />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/players/:id" element={<PlayerDetail />} />
				<Route path="/teams/:id" element={<TeamDetail />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
