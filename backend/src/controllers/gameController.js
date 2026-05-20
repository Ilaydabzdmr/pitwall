/*Mini oyunun iş mantığı — pist listesi, skor kaydetme ve liderboard. getTracks basit, tüm pistleri döner.
submitScore en kritik kısım. Puanlama tamamen backend'de hesaplanır — frontend'den gelen puan değeri kabul edilmez, bu kasıtlı bir güvenlik kararı. 
Temiz başlangıç ve pist dışına çıkmama bonusları sabit, asıl fark tur süresinde: önce o pistin genel rekoru sorgulanır, rekor kırıldıysa 20 puan, 
kırılmadıysa kendi kişisel rekoru kırıldı mı bakılır, o da 10 puan. İki sorgu birbiriyle bağlantılı, sırası önemli. 
Sonunda puan game_scores'a yazılır, users.total_points'e birikimli eklenir.
getTrackLeaderboard o pistin en hızlı 10 turunu kullanıcı adıyla birleştirip ASC sırayla döner — en hızlı en üstte.
Bilinmesi gereken şu: puan hesabı frontend'e bırakılsaydı manipüle edilebilirdi. Backend'de hesaplamak bu riski tamamen kapatır.*/

const db = require('../db/pool');

const getTracks = async (req, res) => {
  try {
    const [tracks] = await db.query('SELECT * FROM tracks');
    res.json(tracks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

const submitScore = async (req, res) => {
  try {
    const { race_id, driver_chosen, lap_time_ms, clean_start, no_track_exit } = req.body;
    const user_id = req.user.id;

    // Puanı backend'de hesapla - frontend'e güvenme
    let points = 0;
    if (clean_start) points += 5;
    if (no_track_exit) points += 5;

    // Pist rekoru mu kontrol et
    const [record] = await db.query(
      'SELECT MIN(lap_time_ms) as best FROM game_scores WHERE race_id = ?',
      [race_id]
    );

    const currentBest = record[0].best;
    if (!currentBest || lap_time_ms < currentBest) {
      points += 20;
      // Pist rekoru kırdı!
    } else {
      // Kendi rekorunu kırdı mı?
      const [myRecord] = await db.query(
        'SELECT MIN(lap_time_ms) as best FROM game_scores WHERE race_id = ? AND user_id = ?',
        [race_id, user_id]
      );
      if (!myRecord[0].best || lap_time_ms < myRecord[0].best) {
        points += 10;
      }
    }

    await db.query(
      `INSERT INTO game_scores (user_id, race_id, driver_chosen, lap_time_ms, clean_start, no_track_exit, points_earned)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, race_id, driver_chosen, lap_time_ms, clean_start, no_track_exit, points]
    );

    // Kullanıcının toplam puanını güncelle
    await db.query(
      'UPDATE users SET total_points = total_points + ? WHERE id = ?',
      [points, user_id]
    );

    res.json({ points_earned: points, message: 'Skor kaydedildi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

const getTrackLeaderboard = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT g.lap_time_ms, g.driver_chosen, u.username
       FROM game_scores g
       JOIN users u ON g.user_id = u.id
       WHERE g.race_id = ?
       ORDER BY g.lap_time_ms ASC
       LIMIT 10`,
      // ASC: en hızlı lap en üstte
      // LIMIT 10: sadece ilk 10 kişi
      [req.params.trackId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

module.exports = { getTracks, submitScore, getTrackLeaderboard };