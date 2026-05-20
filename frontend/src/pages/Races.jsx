import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

function Races() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/races')
      .then(res => setRaces(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">🏎️ Yükleniyor...</div>;

  return (
    <div className="page">
      <h1>📅 2026 Yarış Takvimi</h1>
      <div className="races-grid">
        {races.length === 0 ? (
          <p className="empty">Yarış takvimi henüz yüklenmedi</p>
        ) : (
          races.map(race => (
            <Link to={`/races/${race.id}`} key={race.id} className="race-card big">
              <div className="race-round">Tur {race.jolpica_round}</div>
              <div className="race-name">{race.name}</div>
              <div className="race-circuit">{race.circuit_name}</div>
              <div className="race-country">{race.country}</div>
              <div className="race-date">
                {new Date(race.race_date).toLocaleDateString('tr-TR', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </div>
              <span className={`race-status ${race.status}`}>
                {race.status === 'upcoming' ? '🟡 Tahmin Yapılabilir' :
                 race.status === 'live' ? '🔴 Canlı' : '✅ Tamamlandı'}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default Races;