/*olpica API'siyle konuşan servis katmanı — dış dünyayla bağlantı noktası bu dosya. Üç fonksiyon var, her biri aynı mantıkla çalışır: 
API'den çek, DB'ye yaz.
syncRaces sezon takvimini çeker. ON DUPLICATE KEY UPDATE kritik — aynı yarış iki kez eklenmiyor, varsa güncelleniyor. 
circuitId mini oyun için pist key'i olarak saklanıyor.
syncDrivers aynı mantık, sürücüler için. driverId tekil tanımlayıcı, code ise tahminlerde kullanılan 3 harfli kısaltma 
— VER, HAM, LEC gibi.
syncRaceResults en karmaşık olanı. API'den gelen sonuç dizisini parse eder: 
1. sıra kazanan, FastestLap.rank === '1' en hızlı tur, Finished veya +X Lap içermeyen statuslar DNF sayılır. 
Sonra yarışın DB id'sini bulur, race_results'a yazar, yarışın statusunu finished yapar. full_results_json tüm veriyi ham olarak saklar
 — ileride farklı bir hesaplama gerekirse tekrar API'ye gitmek gerekmez.
Bilinmesi gereken şu: bu katman route'lardan ve controller'lardan bağımsız. 
Hem manuel sync endpoint'lerinden hem cron job'dan çağrılıyor — tek kaynak, iki tetikleyici.*/

const axios = require('axios');
const db = require('../db/pool');

// Jolpica F1 API - Ergast'ın ücretsiz halefi, kayıt gerektirmez
const BASE_URL = 'https://api.jolpi.ca/ergast/f1';

// Sezon takvimini Jolpica'dan çekip DB'ye kaydet
const syncRaces = async (year = 2026) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/${year}/races.json`);
    const races = data.MRData.RaceTable.Races;
    // Jolpica'nın döndürdüğü JSON yapısı bu şekilde

    for (const race of races) {
      await db.query(
        `INSERT INTO races (jolpica_round, name, circuit_name, country, race_date, track_svg_key)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        // ON DUPLICATE KEY: aynı yarış zaten varsa güncelle, ekleme
        [
          race.round,
          race.raceName,                    // "Monaco Grand Prix"
          race.Circuit.circuitName,         // "Circuit de Monaco"
          race.Circuit.Location.country,    // "Monaco"
          race.date,                        // "2025-05-25"
          race.Circuit.circuitId            // "monaco" - mini oyun pist key'i
        ]
      );
    }
    console.log(`✅ ${races.length} yarış senkronize edildi`);
    return races.length;
  } catch (err) {
    console.error('Jolpica sync hatası:', err.message);
    throw err;
  }
};

// Sürücü listesini çekip DB'ye kaydet
const syncDrivers = async (year = 2026) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/${year}/drivers.json`);
    const drivers = data.MRData.DriverTable.Drivers;

    for (const driver of drivers) {
      await db.query(
        `INSERT INTO drivers (driver_id, full_name, code)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
        [
          driver.driverId,               // "max_verstappen"
          `${driver.givenName} ${driver.familyName}`, // "Max Verstappen"
          driver.code                    // "VER"
        ]
      );
    }
    console.log(`✅ ${drivers.length} sürücü senkronize edildi`);
  } catch (err) {
    console.error('Driver sync hatası:', err.message);
    throw err;
  }
};

// Yarış sonuçlarını çekip DB'ye kaydet
const syncRaceResults = async (year, round) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/${year}/${round}/results.json`);
    const raceData = data.MRData.RaceTable.Races[0];

    if (!raceData) throw new Error('Sonuç bulunamadı');

    const results = raceData.Results;
    const winner = results[0].Driver.code;          // 1. sıradaki sürücü
    const fastestLap = results.find(r => r.FastestLap?.rank === '1')?.Driver.code;
    const dnfs = results
      .filter(r => r.status !== 'Finished' && !r.status.includes('Lap'))
      .map(r => r.Driver.code);
    // DNF: Finished veya +X Lap olmayan sürücüler

    // Yarışın DB id'sini bul
    const [raceRows] = await db.query(
      'SELECT id FROM races WHERE jolpica_round = ?', [round]
    );
    const race_id = raceRows[0]?.id;
    if (!race_id) throw new Error('Yarış DB\'de bulunamadı');

    await db.query(
      `INSERT INTO race_results (race_id, winner, fastest_lap, dnf_array, full_results_json)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE winner = VALUES(winner)`,
      [race_id, winner, fastestLap, JSON.stringify(dnfs), JSON.stringify(results)]
    );

    // Yarış statusunu finished yap
    await db.query(
      'UPDATE races SET status = ? WHERE id = ?', ['finished', race_id]
    );

    console.log(`✅ ${raceData.raceName} sonuçları kaydedildi`);
    return { race_id, winner, fastestLap, dnfs };
  } catch (err) {
    console.error('Race results sync hatası:', err.message);
    throw err;
  }
};

module.exports = { syncRaces, syncDrivers, syncRaceResults };