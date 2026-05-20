/*-> createPrediction üç katmanlı kontrol yapar: aynı yarış için mükerrer tahmin var mı, joker kullanılıyorsa daha önce kullanılmış mı, 
her ikisi de temizse tahmin kaydedilir. Joker kontrolü önemli — joker_used flag'i önce okunur, sonra tahmin yazılır, 
sırası tersine çevrilirse aynı anda iki istek yarış durumuna düşebilir. is_joker || false joker gönderilmemişse null yerine false yazar.

-> getMyPredictions kullanıcının tüm tahminlerini yarış adı ve tarihiyle birlikte döner. JOIN olmadan sadece race_id gelirdi, 
frontend tekrar sorgu atmak zorunda kalırdı — tek sorguda birleştirilmiş veri daha verimli.

-> getRacePredictions bir yarışın tüm tahminlerini kullanıcı adlarıyla döner — sosyal özellik, herkes kimin ne tahmin ettiğini görebilir.
Bilinmesi gereken şu: joker sezon boyunca yalnızca bir kez kullanılabilir ve bu kural tamamen backend'de korunuyor, frontend'e bırakılmamış.*/

const db = require('../db/pool');

const createPrediction = async (req, res) => {
  try {
    const { race_id, winner, pole, fastest_lap, dnf, is_joker } = req.body;
    const user_id = req.user.id;
    // req.user: authMiddleware'den geldi

    // Bu kullanıcı bu yarış için daha önce tahmin yaptı mı?
    const [existing] = await db.query(
      'SELECT id FROM predictions WHERE user_id = ? AND race_id = ?',
      [user_id, race_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Bu yarış için zaten tahmin yaptın' });
    }

    // Joker kullanıldıysa users tablosunu güncelle
    if (is_joker) {
      const [user] = await db.query(
        'SELECT joker_used FROM users WHERE id = ?', [user_id]
      );
      if (user[0].joker_used) {
        return res.status(400).json({ error: 'Joker hakkını zaten kullandın' });
      }
      await db.query('UPDATE users SET joker_used = true WHERE id = ?', [user_id]);
    }

    await db.query(
      `INSERT INTO predictions (user_id, race_id, winner, pole, fastest_lap, dnf, is_joker)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, race_id, winner, pole, fastest_lap, dnf, is_joker || false]
    );

    res.status(201).json({ message: 'Tahmin kaydedildi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

const getMyPredictions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, r.name as race_name, r.race_date 
       FROM predictions p
       JOIN races r ON p.race_id = r.id
       WHERE p.user_id = ?
       ORDER BY r.race_date DESC`,
      // JOIN: predictions ve races tablolarını birleştirir
      // Her tahmine o yarışın adı ve tarihi de eklenir
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

const getRacePredictions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.username 
       FROM predictions p
       JOIN users u ON p.user_id = u.id
       WHERE p.race_id = ?`,
      [req.params.raceId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

module.exports = { createPrediction, getMyPredictions, getRacePredictions };