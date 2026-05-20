/*Jolpica API'siyle veritabanını senkronize eden 4 endpoint. Bunları bilmek lazım:
/sync/races ve /sync/drivers manuel tetikleyici — sezon başında bir kez çalıştırılır, 
yarış takvimini ve sürücü listesini Jolpica'dan çekip DB'ye yazar.
/sync/results/:round tek bir turun sonucunu çeker, /sync/all-results ise daha akıllıca 
— LEFT JOIN ile sonucu eksik olan tüm finished yarışları bulur, sırayla Jolpica'dan çeker, her istek arasında 800ms bekler. 
Rate limit aşmamak için o bekleme kritik, kaldırılırsa API bağlantıyı keser.
Auth yok — bunlar admin/geliştirici araçları, production'da mutlaka koruma altına alınması gerekir.*/

const express = require('express');
const router = express.Router();
const jolpica = require('../services/jolpica');

// Sezon takvimini Jolpica'dan çek ve DB'ye kaydet
router.post('/races', async (req, res) => {
  try {
    const count = await jolpica.syncRaces(2026);
    res.json({ message: `${count} yarış senkronize edildi` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Sürücüleri Jolpica'dan çek ve DB'ye kaydet
router.post('/drivers', async (req, res) => {
  try {
    await jolpica.syncDrivers(2026);
    res.json({ message: 'Sürücüler senkronize edildi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/results/:round', async (req, res) => {
  try {
    const result = await jolpica.syncRaceResults(2026, req.params.round);
    res.json({ message: 'Sonuçlar kaydedildi', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
router.post('/all-results', async (req, res) => {
  try {
    const db = require('../db/pool');
    
    const [finishedRaces] = await db.query(`
      SELECT r.id, r.jolpica_round 
      FROM races r
      LEFT JOIN race_results rr ON r.id = rr.race_id
      WHERE r.status = 'finished' AND rr.id IS NULL
    `);

    const results = [];
    for (const race of finishedRaces) {
      try {
        await jolpica.syncRaceResults(2026, race.jolpica_round);
        results.push(`✅ Tur ${race.jolpica_round}`);
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (err) {
        results.push(`⚠️ Tur ${race.jolpica_round}: henüz yok`);
      }
    }

    res.json({ message: 'Tamamlandı', results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;