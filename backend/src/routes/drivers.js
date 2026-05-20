/*Show more22:30Claude responded: 
GET /api/drivers isteği geldiğinde veritabanındaki drivers tablosunu isim sırasıyla çekip JSON olarak döndürür.
GET /api/drivers isteği geldiğinde veritabanındaki drivers tablosunu isim sırasıyla çekip JSON olarak döndürür. 
async/await ile sorgu tamamlanana kadar bekler, hata olursa 500 döner. Tek görevi: sürücü listesini ver.*/

const express = require('express');
const router = express.Router();
const db = require('../db/pool');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM drivers ORDER BY full_name ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;