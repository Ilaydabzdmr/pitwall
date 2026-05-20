import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';

function Home() {
  const [races, setRaces] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Sayfa açılınca yarışları ve liderboard'u çek
    const fetchData = async () => {
      try {
        const [racesRes, lbRes] = await Promise.all([
          api.get('/races'),
          api.get('/leaderboard')
          // Promise.all: ikisini aynı anda çek, ikisi de bitince devam et
        ]);
        setRaces(racesRes.data.slice(0, 5));
        // slice(0,5): sadece ilk 5 yarışı göster
        setLeaderboard(lbRes.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  // []: sadece sayfa ilk açıldığında çalış

  if (loading) return <div className="loading">🏎️ Yükleniyor...</div>;

  return (
    <div className="home">
      <div className="hero">
        <h1>🏆 PitWall</h1>
        <p>F1 yarışlarını tahmin et, puan kazan, pistte sürmek için meydan oku!</p>
        {!user && (
          <div className="hero-buttons">
            <Link to="/register" className="btn-primary">Hemen Katıl</Link>
            <Link to="/login" className="btn-secondary">Giriş Yap</Link>
          </div>
        )}
      </div>

      <div className="home-grid">
        <div className="home-section">
          <h2>📅 Yaklaşan Yarışlar</h2>
          {races.length === 0 ? (
            <p className="empty">Henüz yarış eklenmedi</p>
          ) : (
            races.map(race => (
              <Link to={`/races/${race.id}`} key={race.id} className="race-card">
                <div className="race-country">{race.country}</div>
                <div className="race-name">{race.name}</div>
                <div className="race-date">
                  {new Date(race.race_date).toLocaleDateString('tr-TR')}
                </div>
                <span className={`race-status ${race.status}`}>
                  {race.status === 'upcoming' ? '🟡 Yaklaşıyor' :
                   race.status === 'live' ? '🔴 Canlı' : '✅ Bitti'}
                </span>
              </Link>
            ))
          )}
          <Link to="/races" className="see-all">Tümünü Gör →</Link>
        </div>

        <div className="home-section">
          <h2>🏆 Liderboard</h2>
          {leaderboard.length === 0 ? (
            <p className="empty">Henüz puan kazanılmadı</p>
          ) : (
            leaderboard.map((u, i) => (
              <div key={u.id} className={`lb-row ${user?.id === u.id ? 'highlight' : ''}`}>
                <span className="lb-rank">#{i + 1}</span>
                <span className="lb-name">{u.username}</span>
                <span className="lb-pts">{u.total_points} pt</span>
              </div>
            ))
          )}
          <Link to="/leaderboard" className="see-all">Tümünü Gör →</Link>
        </div>
      </div>
    </div>
  );
}

export default Home;