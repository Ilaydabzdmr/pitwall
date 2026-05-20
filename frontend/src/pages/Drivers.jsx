import { useState, useEffect } from 'react';
import api from '../api/axios';

// Takım adı → logo dosyası eşleştirmesi
const TEAM_LOGOS = {
  'Red Bull Racing': '/teams/redbullracing.png',
  'Ferrari': '/teams/ferrari.png',
  'McLaren': '/teams/mclaren.png',
  'Mercedes': '/teams/mercedes.png',
  'Aston Martin': '/teams/astonmartin.png',
  'Alpine': '/teams/alpine.png',
  'Williams': '/teams/williams.png',
  'Racing Bulls': '/teams/racingbulls.png',
  'Haas': '/teams/haas.png',
  'Audi': '/teams/audi.png',
  'Cadillac': '/teams/cadillac.png',
};

function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/drivers')
      .then(res => setDrivers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">🏎️ Yükleniyor...</div>;

  return (
    <div className="page">
      <h1>🏎️ 2026 Sürücüler</h1>
      <div className="drivers-grid">
        {drivers.length === 0 ? (
          <p className="empty">Sürücüler henüz yüklenmedi</p>
        ) : (
          drivers.map(driver => (
            <div
              key={driver.id}
              className="driver-card"
              style={{ borderTop: `4px solid ${driver.team_color || '#e10600'}` }}
            >
              {/* Takım logosu */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.5rem'
              }}>
                <div className="driver-code">{driver.code}</div>
                {TEAM_LOGOS[driver.team] && (
                  <img
                    src={TEAM_LOGOS[driver.team]}
                    alt={driver.team}
                    style={{
                      width: '36px',
                      height: '36px',
                      objectFit: 'contain',
                      borderRadius: '6px',
                      opacity: 0.9
                    }}
                  />
                )}
              </div>

              <div className="driver-name">{driver.full_name}</div>
              <div className="driver-team">{driver.team}</div>

              <div className="driver-stats">
                <div className="stat">
                  <span>Hız</span>
                  <div className="stat-bar">
                    <div
                      className="stat-fill"
                      style={{ width: `${(driver.speed_stat / 10) * 100}%` }}
                    />
                  </div>
                  <span>{driver.speed_stat}/10</span>
                </div>
                <div className="stat">
                  <span>Tutuş</span>
                  <div className="stat-bar">
                    <div
                      className="stat-fill"
                      style={{ width: `${(driver.grip_stat / 10) * 100}%` }}
                    />
                  </div>
                  <span>{driver.grip_stat}/10</span>
                </div>
                <div className="stat">
                  <span>İvme</span>
                  <div className="stat-bar">
                    <div
                      className="stat-fill"
                      style={{ width: `${(driver.accel_stat / 10) * 100}%` }}
                    />
                  </div>
                  <span>{driver.accel_stat}/10</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Drivers;