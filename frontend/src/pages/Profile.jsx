import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';

function Profile() {
  const { user, logout } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/predictions/me')
      .then(res => setPredictions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">👤 Yükleniyor...</div>;

  return (
    <div className="page">
      <div className="profile-header">
        <div className="profile-avatar">
          {user?.username?.[0]?.toUpperCase()}
          {/* Kullanıcı adının ilk harfi avatar olarak */}
        </div>
        <div>
          <h1>{user?.username}</h1>
          <p>{user?.email}</p>
          <p className="total-points">🏆 {user?.total_points || 0} Toplam Puan</p>
        </div>
        <button onClick={logout} className="btn-danger">Çıkış Yap</button>
      </div>

      <div className="predictions-history">
        <h2>📊 Tahmin Geçmişim</h2>
        {predictions.length === 0 ? (
          <p className="empty">Henüz tahmin yapmadın</p>
        ) : (
          predictions.map(p => (
            <div key={p.id} className="prediction-row">
              <div className="pred-race">{p.race_name}</div>
              <div className="pred-details">
                <span>🏆 {p.winner}</span>
                <span>🥇 {p.pole}</span>
                <span>⚡ {p.fastest_lap}</span>
                {p.dnf && <span>💥 {p.dnf}</span>}
                {p.is_joker && <span>🃏 Joker</span>}
              </div>
              <div className="pred-points">
                {p.points_earned > 0 ? `+${p.points_earned} pt` : 'Bekleniyor...'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Profile;