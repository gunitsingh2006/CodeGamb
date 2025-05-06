import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';
import Leaderboard from './pages/Leaderboard';
import Layout from './components/Layout';

function App() {
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    document.title = 'CodeBattle - Real-time Coding Competitions';
  }, []);

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/lobby" />} />
      <Route element={<Layout />}>
        <Route path="/lobby" element={isAuthenticated ? <Lobby /> : <Navigate to="/login" />} />
        <Route path="/game/:gameId" element={isAuthenticated ? <GameRoom /> : <Navigate to="/login" />} />
        <Route path="/leaderboard" element={isAuthenticated ? <Leaderboard /> : <Navigate to="/login" />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? "/lobby" : "/login"} />} />
    </Routes>
  );
}

export default App;