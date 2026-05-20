/*-> getRaces tüm yarışları tarihe göre artan sırayla döner, en yakın yarış en üstte.
  -> getRaceById URL'deki id'yi alır, o yarışı bulur, yoksa 404 döner. Basit ama 404 kontrolü önemli — bulunamayan yarış için boş dizi değil net hata mesajı döner.
  -> getRaceResults aynı mantık, yarışın sonuç kaydını döner. Sonuç henüz yoksa 404 — bu normal bir durum, yarış henüz bitmemiş olabilir.
  -> scoreRace en kritik endpoint. scorer servisi burada lazy load ediliyor — dosya başında değil, fonksiyon içinde require ediliyor, 
  döngüsel bağımlılık riskini önlemek için. calculatePoints(id) çağrılır, o yarışa ait tüm tahminler puanlanır, users.total_points güncellenir. 
  Bu endpoint tetiklenmeden puanlar hesaplanmaz — manuel veya otomatik çağrılması gerekir.*/

const db = require('../db/pool');
const jolpica = require('../services/jolpica');

const getRaces = async (req, res) => {
  try {
    const [races] = await db.query(
      'SELECT * FROM races ORDER BY race_date ASC'
      // ASC: tarihe göre artan sıra - en yakın yarış önce
    );
    res.json(races);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

const getRaceById = async (req, res) => {
  try {
    const { id } = req.params;
    // req.params.id: URL'deki :id parametresi
    // GET /api/races/5 → id = "5"

    const [rows] = await db.query(
      'SELECT * FROM races WHERE id = ?', [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Yarış bulunamadı' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

const getRaceResults = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM race_results WHERE race_id = ?', [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Sonuç henüz yok' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

const scoreRace = async (req, res) => {
  try {
    const { id } = req.params;
    const scorer = require('../services/scorer');
    await scorer.calculatePoints(id);
    res.json({ message: 'Puanlama tamamlandı' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

module.exports = { getRaces, getRaceById, getRaceResults, scoreRace };