/*Kimlik sistemi — kayıt, giriş ve profil. Üç fonksiyon, her biri net bir iş yapar.

-> register gelen veriyi doğrular, aynı email/username var mı kontrol eder, şifreyi bcrypt ile hash'ler ve DB'ye yazar. 
Şifre hiçbir zaman düz metin olarak saklanmaz — hash'den geri dönüş yoktur, birisi DB'ye erişse bile şifrelere ulaşamaz. 
? parametreleri SQL injection'ı engeller, string birleştirmeyle sorgu yazılmaz.

-> login email ile kullanıcıyı bulur, bcrypt.compare() ile girilen şifreyi hash'le karşılaştırır — şifreyi çözmez, karşılaştırır, fark önemli.
Doğruysa jwt.sign() ile 7 günlük token üretir, içine id/username/email yazar, şifre asla token'a girmez. 
Frontend bu token'ı saklar ve her korumalı istekte header'a ekler.

->getMe en basiti — authMiddleware zaten req.user'ı doldurmuştur, direkt o id ile DB'den güncel kullanıcı bilgisini çeker. 
Token'daki veriyi değil, DB'deki güncel veriyi döner — total_points değişmiş olabilir, token'daki eski değeri vermek yanlış olur.

Bilinmesi gereken şu: bu üç fonksiyon birbirini tamamlar — register hesap açar, login token verir, getMe o token'la kim olduğunu söyler.*/

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/pool');

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    // req.body: frontend'den gelen JSON verisi
    // Örnek: { "username": "ilayd", "email": "i@i.com", "password": "123456" }

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Tüm alanları doldur' });
      // 400: Bad Request - eksik veri
    }

    // Aynı email veya username var mı kontrol et
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
      // ?: SQL injection'ı önler, asla string birleştirme kullanma
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Bu email veya kullanıcı adı zaten kullanımda' });
      // 409: Conflict - çakışma var
    }

    const hash = await bcrypt.hash(password, 10);
    // Şifreyi 10 tur karıştırarak hash'le
    // Geri dönüşü yok - hash'den şifre elde edilemez

    await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hash]
    );

    res.status(201).json({ message: 'Kayıt başarılı' });
    // 201: Created - yeni kayıt oluşturuldu

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
    // 500: Internal Server Error
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    const user = rows[0];
    // rows: sorgu sonucu dizi. rows[0]: ilk (tek) kullanıcı

    if (!user) {
      return res.status(401).json({ error: 'Email veya şifre hatalı' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    // Girilen şifreyi hash'leyip DB'deki hash ile karşılaştırır
    // Şifreyi çözmez, karşılaştırır - güvenli yöntem bu

    if (!valid) {
      return res.status(401).json({ error: 'Email veya şifre hatalı' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      // Token içine yazılan bilgiler - şifre ASLA yazılmaz
      process.env.JWT_SECRET,
      // İmzalama anahtarı - .env'de tutulur
      { expiresIn: '7d' }
      // 7 gün sonra token geçersiz olur
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, total_points: user.total_points }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

const getMe = async (req, res) => {
  try {
    // authMiddleware req.user'ı doldurdu, direkt kullanıyoruz
    const [rows] = await db.query(
      'SELECT id, username, email, total_points, joker_used FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
};

module.exports = { register, login, getMe };