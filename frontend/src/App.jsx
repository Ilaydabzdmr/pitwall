import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Races from './pages/Races';
import RaceDetail from './pages/RaceDetail';
import Drivers from './pages/Drivers';
import Leaderboard from './pages/Leaderboard';
import Game from './pages/Game';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';

// Müziği global olarak paylaş
export const bgMusicRef = { current: null };

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Yükleniyor...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const location = useLocation();
  const audioRef = useRef(null);

  useEffect(() => {
    // Müziği bir kez oluştur
    const audio = new Audio('/bg-music.mp3');
    audio.loop = true;
    audio.volume = 0.25;
    audioRef.current = audio;
    bgMusicRef.current = audio;

    // İlk tıklamada başlat
    const start = () => {
      audio.play().catch(() => {});
      document.removeEventListener('click', start);
    };
    document.addEventListener('click', start);

    return () => {
      audio.pause();
      document.removeEventListener('click', start);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const isGamePage = location.pathname.startsWith('/game');

    if (isGamePage) {
      // Oyun sayfasında müziği durdur
      audio.pause();
    } else {
      // Diğer sayfalarda çal
      audio.play().catch(() => {});
    }
  }, [location.pathname]);

  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/register"    element={<Register />} />
        <Route path="/races"       element={<Races />} />
        <Route path="/races/:id"   element={<RaceDetail />} />
        <Route path="/drivers"     element={<Drivers />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/game/:id" element={
          <PrivateRoute><Game /></PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute><Profile /></PrivateRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;