/*Tahmin puanlama motoru — sistemin en kritik iş mantığı burada. Bir yarış bittikten sonra calculatePoints(race_id) çağrılır ve şu sıra işler:
Önce o yarışın sonucunu ve tüm tahminlerini DB'den çeker. Sonra her tahmin için tek tek karşılaştırma yapar: kazanan, pole, en hızlı tur eşleşirse sabit puan eklenir,
DNF tahmini sonuç dizisinde includes() ile aranır. En son joker kontrolü — is_joker true ise toplam puan ikiye katlanır, bu yüzden joker hesabı en sona bırakılmış, 
doğru sıralama önemli.
Her tahmin için iki ayrı UPDATE çalışır: biri predictions tablosuna o tahminin kazandığı puanı yazar, 
diğeri users tablosuna total_points + ? ile birikimli ekler — sıfırdan yazmaz, üstüne ekler.
Bilinmesi gereken şu: bu fonksiyon yarış sonucu DB'de olmadan çalışmaz, önce syncRaceResults çalışmış olması lazım. 
İkisi birbirini tamamlar — biri veriyi çeker, biri puanı hesaplar.*/

const db = require('../db/pool');

// Puan tablosu - kaç puan neye karşılık gelir
const POINTS = {
  winner: 25,      // Kazananı doğru bildin
  pole: 10,        // Pole pozisyonu doğru bildin
  fastest_lap: 5,  // En hızlı turu doğru bildin
  dnf: 8           // DNF sürücüyü doğru bildin
};

const calculatePoints = async (race_id) => {
  try {
    // O yarışın sonuçlarını al
    const [resultRows] = await db.query(
      'SELECT * FROM race_results WHERE race_id = ?', [race_id]
    );

    if (resultRows.length === 0) {
      throw new Error('Önce yarış sonuçlarını kaydet');
    }

    const result = resultRows[0];
    const dnfArray = JSON.parse(result.dnf_array || '[]');
    // dnf_array JSON string olarak saklandı, parse et

    // O yarışa ait tüm tahminleri al
    const [predictions] = await db.query(
      'SELECT * FROM predictions WHERE race_id = ?', [race_id]
    );

    for (const prediction of predictions) {
      let points = 0;

      // Kazanan doğru mu?
      if (prediction.winner === result.winner) points += POINTS.winner;

      // Pole doğru mu?
      if (prediction.pole === result.pole) points += POINTS.pole;

      // En hızlı tur doğru mu?
      if (prediction.fastest_lap === result.fastest_lap) points += POINTS.fastest_lap;

      // DNF doğru mu? (dizide var mı kontrol et)
      if (prediction.dnf && dnfArray.includes(prediction.dnf)) points += POINTS.dnf;

      // Joker kullandıysa puanı 2 katına çıkar
      if (prediction.is_joker) points *= 2;

      // predictions tablosunu güncelle
      await db.query(
        'UPDATE predictions SET points_earned = ? WHERE id = ?',
        [points, prediction.id]
      );

      // users tablosundaki total_points artır
      await db.query(
        'UPDATE users SET total_points = total_points + ? WHERE id = ?',
        [points, prediction.user_id]
      );
    }

    console.log(`✅ ${predictions.length} tahmin puanlandı`);
    return { scored: predictions.length };
  } catch (err) {
    console.error('Scoring hatası:', err.message);
    throw err;
  }
};

module.exports = { calculatePoints };