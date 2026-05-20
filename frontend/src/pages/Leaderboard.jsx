import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';

function Leaderboard() {
  const [season, setSeason] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [tab, setTab] = useState('season');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      api.get('/leaderboard'),
      api.get('/leaderboard/weekly')
    ]).then(([sRes, wRes]) => {
      setSeason(sRes.data);
      setWeekly(wRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const data = tab === 'season' ? season : weekly;
  const pointsKey = tab === 'season' ? 'total_points' : 'weekly_points';

  if (loading) return <div className="loading">🏆 Yükleniyor...</div>;

  return (
    <div className="page">
      <h1>🏆 Liderboard</h1>
      <div className="tabs">
        <button
          className={tab === 'season' ? 'active' : ''}
          onClick={() => setTab('season')}
        >Sezon Genel</button>
        <button
          className={tab === 'weekly' ? 'active' : ''}
          onClick={() => setTab('weekly')}
        >Bu Hafta</button>
      </div>

      <div className="leaderboard">
        {data.length === 0 ? (
          <p className="empty">Henüz puan yok</p>
        ) : (
          data.map((u, i) => (
            <div
              key={u.id || u.username}
              className={`lb-row ${user?.username === u.username ? 'highlight' : ''}`}
            >
              <span className="lb-rank">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </span>
              <span className="lb-name">{u.username}</span>
              <span className="lb-pts">{u[pointsKey]} pt</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Leaderboard;