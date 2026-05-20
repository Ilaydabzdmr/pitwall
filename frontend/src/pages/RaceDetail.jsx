import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';

function RaceDetail() {
    const { id } = useParams();

    const [race, setRace] = useState(null);
    const [drivers, setDrivers] = useState([]);
    const [results, setResults] = useState(null);
    const [prediction, setPrediction] = useState({
        winner: '', pole: '', fastest_lap: '', dnf: '', is_joker: false
    });
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        Promise.all([
            api.get(`/races/${id}`),
            api.get('/drivers'),
            api.get(`/races/${id}/results`).catch(() => ({ data: null }))
        ]).then(([raceRes, driversRes, resultsRes]) => {
            setRace(raceRes.data);
            setDrivers(driversRes.data);
            setResults(resultsRes.data);
        }).catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/predictions', { ...prediction, race_id: id });
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Tahmin gönderilemedi');
        }
    };

    const parseDnf = (dnf_array) => {
        if (!dnf_array) return '-';
        if (Array.isArray(dnf_array)) return dnf_array.join(', ');
     try {
        const parsed = JSON.parse(dnf_array);
        return Array.isArray(parsed) ? parsed.join(', ') : String(dnf_array);
  } catch {
        return String(dnf_array);
  }
};

    if (loading) return <div className="loading">🏎️ Yükleniyor...</div>;
    if (!race) return <div className="error">Yarış bulunamadı</div>;

    return (
        <div className="page">
            <div className="race-header">
                <h1>{race.name}</h1>
                <p>{race.circuit_name} — {race.country}</p>
                <p>{new Date(race.race_date).toLocaleDateString('tr-TR', {
                    day: 'numeric', month: 'long', year: 'numeric'
                })}</p>
                <span className={`race-status ${race.status}`}>
                    {race.status === 'upcoming' ? '🟡 Tahmin Açık' :
                        race.status === 'live' ? '🔴 Canlı' : '✅ Tamamlandı'}
                </span>
            </div>

            {results && (
                <div className="race-results">
                    <h2>🏁 Yarış Sonuçları</h2>
                    <div className="results-grid">
                        <div className="result-item winner">
                            <span className="result-label">🏆 Kazanan</span>
                            <span className="result-value">{results.winner}</span>
                        </div>
                        <div className="result-item">
                            <span className="result-label">⚡ En Hızlı Tur</span>
                            <span className="result-value">{results.fastest_lap || '-'}</span>
                        </div>
                    </div>
                    <div className="dnf-section">
                        <span className="result-label">💥 DNF'ler</span>
                        <div className="dnf-list">
                            {parseDnf(results.dnf_array).split(', ').map((code, i) => (
                                <span key={i} className="dnf-badge">{code}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <Link to={`/game/${id}`} className="game-btn">
                🎮 Bu Pistte Sürmek için Tıkla!
            </Link>

            {race.status === 'upcoming' && user ? (
                submitted ? (
                    <div className="success-msg">✅ Tahminin kaydedildi! Yarışı bekle.</div>
                ) : (
                    <div className="prediction-form">
                        <h2>🎯 Tahminini Yap</h2>
                        {error && <div className="error-msg">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>🏆 Yarış Kazananı</label>
                                <select
                                    value={prediction.winner}
                                    onChange={e => setPrediction({ ...prediction, winner: e.target.value })}
                                    required
                                >
                                    <option value="">Sürücü seç</option>
                                    {drivers.map(d => (
                                        <option key={d.id} value={d.code}>{d.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>🥇 Pole Pozisyon</label>
                                <select
                                    value={prediction.pole}
                                    onChange={e => setPrediction({ ...prediction, pole: e.target.value })}
                                    required
                                >
                                    <option value="">Sürücü seç</option>
                                    {drivers.map(d => (
                                        <option key={d.id} value={d.code}>{d.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>⚡ En Hızlı Tur</label>
                                <select
                                    value={prediction.fastest_lap}
                                    onChange={e => setPrediction({ ...prediction, fastest_lap: e.target.value })}
                                >
                                    <option value="">Sürücü seç</option>
                                    {drivers.map(d => (
                                        <option key={d.id} value={d.code}>{d.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>💥 DNF (Yarışı Terk Eden)</label>
                                <select
                                    value={prediction.dnf}
                                    onChange={e => setPrediction({ ...prediction, dnf: e.target.value })}
                                >
                                    <option value="">Sürücü seç</option>
                                    {drivers.map(d => (
                                        <option key={d.id} value={d.code}>{d.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="joker-toggle">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={prediction.is_joker}
                                        onChange={e => setPrediction({ ...prediction, is_joker: e.target.checked })}
                                    />
                                    🃏 Joker Kullan (Puanı 2x yap — sezonda 1 kez!)
                                </label>
                            </div>

                            <button type="submit" className="btn-primary">
                                Tahminimi Gönder 🚀
                            </button>
                        </form>
                    </div>
                )
            ) : !user ? (
                <div className="login-prompt">
                    <p>Tahmin yapmak için <Link to="/login">giriş yap</Link></p>
                </div>
            ) : (
                <div className="closed-msg">⛔ Tahmin süresi kapandı</div>
            )}
        </div>
    );
}

export default RaceDetail;