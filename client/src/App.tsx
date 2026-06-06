import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PlayerDetail from './pages/PlayerDetail';
import TeamDetail from './pages/TeamDetail';
import Navbar from './components/Navbar';

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
