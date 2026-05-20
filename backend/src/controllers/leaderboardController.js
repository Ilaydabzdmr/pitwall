/*İki liderboard sorgusu, ikisi de basit.
getSeasonLeaderboard tüm kullanıcıları total_points'e göre büyükten küçüğe sıralar, ilk 50'yi döner. Sezon boyunca biriken toplam puan baz alınır.
getWeeklyLeaderboard şu an yapısal olarak sezon liderboard'undan çok farklı değil — total_points üzerinden sıralıyor, gerçek haftalık filtreleme yok. 
CAST(... AS UNSIGNED) negatif puan olasılığına karşı önlem. İleride gerçek haftalık hesaplama eklenecekse 
predictions.created_at veya game_scores.created_at üzerinden o haftanın puanları ayrıca toplanması lazım.*/
const db = require('../db/pool');

const getSeasonLeaderboard = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, username, total_points
       FROM users
       ORDER BY total_points DESC
       LIMIT 50`
      // DESC: en yüksek puan en üstte
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

const getWeeklyLeaderboard = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username,
       CAST(u.total_points AS UNSIGNED) as weekly_points
       FROM users u
       WHERE u.total_points > 0
       ORDER BY u.total_points DESC
       LIMIT 20`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};
module.exports = { getSeasonLeaderboard, getWeeklyLeaderboard };