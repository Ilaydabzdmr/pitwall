//İstek gelir → Express yakalar → Middleware'den geçer → Route'a yönlenir → Cevap döner

const express = require('express');
const cors = require('cors');
require('dotenv').config();
/*-> cors() → React 5173 portunda, backend 3001'de çalışıyor. 
Farklı portlar = farklı "origin". Tarayıcı normalde bunu engeller, cors() bu duvarı kaldırır.
  -> express.json() → Gelen isteğin body'si ham text'tir. 
Bu middleware onu parse edip req.body'e JavaScript objesi olarak yazar. Olmasa req.body → undefined.*/ 

// Route dosyalarını içe aktar
const authRoutes        = require('./src/routes/auth');
const racesRoutes       = require('./src/routes/races');
const predictionsRoutes = require('./src/routes/predictions');
const gameRoutes        = require('./src/routes/game');
const leaderboardRoutes = require('./src/routes/leaderboard');
const driversRoutes = require('./src/routes/drivers');
const app = express();
const syncRoutes = require('./src/routes/sync');

// Middleware'ler
app.use(cors());         // Farklı porttan gelen isteklere izin ver (React:5173)
app.use(express.json()); // Gelen isteklerin body'sini JSON olarak oku

// Tüm route'ları bağla
app.use('/api/auth',        authRoutes);
app.use('/api/races',       racesRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/game',        gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/sync', syncRoutes);
/*Her route kendi dosyasında yaşar, server.js sadece trafik polisi — gelen isteğin URL'ine bakıp doğru dosyaya yönlendirir.*/ 
/*POST /api/auth/login    → authRoutes
  GET  /api/races         → racesRoutes
  GET  /api/leaderboard   → leaderboardRoutes
/api prefix'i tüm backend endpoint'lerini frontend route'larından ayırır. Temiz ve net.*/

// Sunucuyu başlat
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ PitWall backend çalışıyor: http://localhost:${PORT}`);
});
/*process.env.PORT || 3001 → .env'de PORT varsa onu kullan, yoksa 3001'e düş. 
  Production'da hosting platformu kendi portunu verir, bu sayede uyum sağlar.*/

const cron = require('node-cron');
const jolpica = require('./src/services/jolpica');

/*'0 6 * * *' = Her gün 06:00'da çalış.
┌─ dakika (0)
│ ┌─ saat (6)
│ │ ┌─ ayın günü (*)
│ │ │ ┌─ ay (*)
│ │ │ │ ┌─ haftanın günü (*)
0 6 * * **/
// Her gün sabah 06:00'da çalışır
cron.schedule('0 6 * * *', async () => {
  const db = require('./src/db/pool');
  const today = new Date().toISOString().split('T')[0];

  console.log(`🔄 Günlük otomatik güncelleme başladı: ${today}`);

  try {
    // 1. Tarihi geçen yarışları finished yap
    await db.query(
      'UPDATE races SET status = ? WHERE race_date < ? AND status = ?',
      ['finished', today, 'upcoming']
    );
    console.log('✅ Yarış statusları güncellendi');

    // 2. Sonucu kaydedilmemiş finished yarışları bul
    const [finishedRaces] = await db.query(`
      SELECT r.id, r.jolpica_round 
      FROM races r
      LEFT JOIN race_results rr ON r.id = rr.race_id
      WHERE r.status = 'finished' AND rr.id IS NULL
    `);
    // LEFT JOIN: race_results'ta karşılığı olmayan yarışları bulur

    console.log(`📊 ${finishedRaces.length} yarışın sonucu eksik, çekiliyor...`);

    // 3. Her eksik yarışın sonucunu Jolpica'dan çek
    for (const race of finishedRaces) {
      try {
        await jolpica.syncRaceResults(2026, race.jolpica_round);
        console.log(`✅ Tur ${race.jolpica_round} sonucu kaydedildi`);
        // Rate limit aşmamak için kısa bekle
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.log(`⚠️ Tur ${race.jolpica_round} sonucu henüz yok`);
      }
    }

    console.log('🏁 Günlük güncelleme tamamlandı');
  } catch (err) {
    console.error('❌ Otomatik güncelleme hatası:', err.message);
  }
});